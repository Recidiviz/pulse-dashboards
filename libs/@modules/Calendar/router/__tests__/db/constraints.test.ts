// Recidiviz - a data platform for criminal justice reform
// Copyright (C) 2026 Recidiviz, Inc.
//
// This program is free software: you can redistribute it and/or modify
// it under the terms of the GNU General Public License as published by
// the Free Software Foundation, either version 3 of the License, or
// (at your option) any later version.
//
// This program is distributed in the hope that it will be useful,
// but WITHOUT ANY WARRANTY; without even the implied warranty of
// MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.  See the
// GNU General Public License for more details.
//
// You should have received a copy of the GNU General Public License
// along with this program.  If not, see <https://www.gnu.org/licenses/>.
// =============================================================================

// Runs against a real Postgres with the migrations applied: nx test-db
// @modules/Calendar/router.

import { getPrismaClient } from "~@modules/Calendar/prisma";

import {
  allHandsEntryData,
  AUDIT_EMAIL,
  calendarData,
  createDemoCalendar,
  DemoCalendar,
  expectConstraintError,
  expectUniqueError,
  sessionEntryData,
  sessionPatternData,
} from "../setup/fixtures";
import { resetCalendarTables } from "../setup/resetCalendarTables";

const prisma = getPrismaClient("US_CO");
let demo: DemoCalendar;

beforeEach(async () => {
  await resetCalendarTables(prisma);
  demo = await createDemoCalendar(prisma);
});

afterAll(async () => {
  await prisma.$disconnect();
});

describe("Calendar", () => {
  test("a second calendar with the same code fails", async () => {
    await expectUniqueError(
      prisma.calendar.create({ data: calendarData("DEMO_CALENDAR") }),
    );
  });
});

describe("resource types, resources and kinds", () => {
  test("a duplicate resource type code in one calendar fails", async () => {
    await expectUniqueError(
      prisma.calendarResourceType.create({
        data: {
          calendarId: demo.calendar.id,
          code: "SITE",
          label: "Site again",
          sortOrder: 2,
        },
      }),
    );
  });

  test("a duplicate resource code in one calendar fails", async () => {
    await expectUniqueError(
      prisma.calendarResource.create({
        data: {
          calendarId: demo.calendar.id,
          typeId: demo.resource.typeId,
          code: "SITE_A",
          label: "Site A again",
          sortOrder: 2,
          createdByEmail: AUDIT_EMAIL,
          updatedByEmail: AUDIT_EMAIL,
        },
      }),
    );
  });

  test("a duplicate kind code in one calendar fails", async () => {
    await expectUniqueError(
      prisma.calendarEntryKind.create({
        data: {
          calendarId: demo.calendar.id,
          code: "SESSION",
          label: "Session again",
          sortOrder: 4,
        },
      }),
    );
  });
});

describe("CalendarMonth", () => {
  test.each([0, 13])(
    "month %i fails CalendarMonth_month_range",
    async (month) => {
      await expectConstraintError(
        prisma.calendarMonth.create({
          data: {
            calendarId: demo.calendar.id,
            year: 2026,
            month,
            createdByEmail: AUDIT_EMAIL,
            updatedByEmail: AUDIT_EMAIL,
          },
        }),
        "CalendarMonth_month_range",
      );
    },
  );

  test("a second month with the same year and month in one calendar fails", async () => {
    await expectUniqueError(
      prisma.calendarMonth.create({
        data: {
          calendarId: demo.calendar.id,
          year: 2026,
          month: 9,
          createdByEmail: AUDIT_EMAIL,
          updatedByEmail: AUDIT_EMAIL,
        },
      }),
    );
  });

  test("another calendar can have the same year and month", async () => {
    const other = await createDemoCalendar(prisma, "OTHER_CALENDAR");

    expect(other.month).toMatchObject({ year: 2026, month: 9 });
  });
});

describe("CalendarEntry", () => {
  test("a second entry with the same date and resource slot fails", async () => {
    await prisma.calendarEntry.create({ data: sessionEntryData(demo) });

    await expectUniqueError(
      prisma.calendarEntry.create({ data: sessionEntryData(demo) }),
    );
  });

  test("a second entry with the same date and resource-less slot fails", async () => {
    await prisma.calendarEntry.create({ data: allHandsEntryData(demo) });

    await expectUniqueError(
      prisma.calendarEntry.create({ data: allHandsEntryData(demo) }),
    );
  });

  test("two resource-less kinds can share a date", async () => {
    await prisma.calendarEntry.create({ data: allHandsEntryData(demo) });

    await expect(
      prisma.calendarEntry.create({
        data: {
          ...allHandsEntryData(demo),
          kindId: demo.kinds.planning.id,
          slotKey: "PLANNING",
        },
      }),
    ).resolves.toMatchObject({ slotKey: "PLANNING" });
  });

  test("a resource slotKey with no resource fails CalendarEntry_slotKey_matches_resource", async () => {
    await expectConstraintError(
      prisma.calendarEntry.create({
        data: { ...sessionEntryData(demo), resourceId: null },
      }),
      "CalendarEntry_slotKey_matches_resource",
    );
  });

  test("a resource-less slotKey with a resource fails CalendarEntry_slotKey_matches_resource", async () => {
    await expectConstraintError(
      prisma.calendarEntry.create({
        data: { ...allHandsEntryData(demo), resourceId: demo.resource.id },
      }),
      "CalendarEntry_slotKey_matches_resource",
    );
  });

  test("cancelledAt without cancelledByEmail fails CalendarEntry_cancel_fields_together", async () => {
    await expectConstraintError(
      prisma.calendarEntry.create({
        data: { ...allHandsEntryData(demo), cancelledAt: new Date() },
      }),
      "CalendarEntry_cancel_fields_together",
    );
  });

  test("cancelledAt with cancelledByEmail passes", async () => {
    await expect(
      prisma.calendarEntry.create({
        data: {
          ...allHandsEntryData(demo),
          cancelledAt: new Date(),
          cancelledByEmail: AUDIT_EMAIL,
        },
      }),
    ).resolves.toMatchObject({ cancelledByEmail: AUDIT_EMAIL });
  });

  // Entry-type behaviour is each state's code, not a column, so
  // code checks it on every write and the database accepts a cancelled
  // SESSION.
  test("cancelling a kind that isn't cancellable is not a database error", async () => {
    await expect(
      prisma.calendarEntry.create({
        data: {
          ...sessionEntryData(demo),
          cancelledAt: new Date(),
          cancelledByEmail: AUDIT_EMAIL,
        },
      }),
    ).resolves.toBeDefined();
  });
});

// Seed SQL inserts rows without the procedures' checks, so the
// database itself must refuse a row that points at another calendar's kind,
// resource, type or month.
describe("calendar-scoped foreign keys", () => {
  let other: DemoCalendar;

  beforeEach(async () => {
    other = await createDemoCalendar(prisma, "OTHER_CALENDAR");
  });

  test.each([
    ["kind", "CalendarEntry_calendarId_kindId_fkey"],
    ["resource", "CalendarEntry_calendarId_resourceId_fkey"],
    ["month", "CalendarEntry_calendarId_monthId_fkey"],
  ] as const)(
    "an entry whose %s belongs to another calendar fails %s",
    async (field, constraint) => {
      const change = {
        kind: { kindId: other.kinds.session.id },
        resource: { resourceId: other.resource.id },
        month: { monthId: other.month.id },
      }[field];

      await expectConstraintError(
        prisma.calendarEntry.create({
          data: { ...sessionEntryData(demo), ...change },
        }),
        constraint,
      );
    },
  );

  test.each([
    ["kind", "CalendarEntryPattern_calendarId_kindId_fkey"],
    ["resource", "CalendarEntryPattern_calendarId_resourceId_fkey"],
  ] as const)(
    "a pattern whose %s belongs to another calendar fails %s",
    async (field, constraint) => {
      const change = {
        kind: { kindId: other.kinds.session.id },
        resource: { resourceId: other.resource.id },
      }[field];

      await expectConstraintError(
        prisma.calendarEntryPattern.create({
          data: { ...sessionPatternData(demo), ...change },
        }),
        constraint,
      );
    },
  );

  test("a resource whose type belongs to another calendar fails CalendarResource_calendarId_typeId_fkey", async () => {
    await expectConstraintError(
      prisma.calendarResource.create({
        data: {
          calendarId: demo.calendar.id,
          typeId: other.resource.typeId,
          code: "SITE_B",
          label: "Site B",
          sortOrder: 2,
          createdByEmail: AUDIT_EMAIL,
          updatedByEmail: AUDIT_EMAIL,
        },
      }),
      "CalendarResource_calendarId_typeId_fkey",
    );
  });

  test("an entry whose month, kind and resource share its calendar inserts", async () => {
    await expect(
      prisma.calendarEntry.create({ data: sessionEntryData(other) }),
    ).resolves.toMatchObject({ calendarId: other.calendar.id });
    // createDemoCalendar inserted other's resource with other's own type.
    expect(other.resource.calendarId).toBe(other.calendar.id);
  });
});

// Entries and patterns carry the same time checks.
describe.each([
  {
    table: "CalendarEntry",
    insert: (times: { startTime?: string | null; endTime?: string | null }) =>
      prisma.calendarEntry.create({
        data: { ...sessionEntryData(demo), ...times },
      }),
  },
  {
    table: "CalendarEntryPattern",
    insert: (times: { startTime?: string | null; endTime?: string | null }) =>
      prisma.calendarEntryPattern.create({
        data: { ...sessionPatternData(demo), ...times },
      }),
  },
])("$table times", ({ table, insert }) => {
  test.each(["8:00", "24:00", "08:60", "08:00:00"])(
    `startTime %j fails ${table}_time_format`,
    async (startTime) => {
      await expectConstraintError(
        insert({ startTime }),
        `${table}_time_format`,
      );
    },
  );

  test("an endTime that isn't HH:mm fails the time format check", async () => {
    await expectConstraintError(
      insert({ startTime: "08:00", endTime: "5pm" }),
      `${table}_time_format`,
    );
  });

  test("an endTime with no startTime fails the order check", async () => {
    await expectConstraintError(
      insert({ startTime: null, endTime: "17:00" }),
      `${table}_endTime_after_startTime`,
    );
  });

  test.each(["07:00", "08:00"])(
    "endTime %s with startTime 08:00 fails the order check",
    async (endTime) => {
      await expectConstraintError(
        insert({ startTime: "08:00", endTime }),
        `${table}_endTime_after_startTime`,
      );
    },
  );

  test.each([
    { startTime: "08:00", endTime: "17:00" },
    { startTime: "08:00", endTime: null },
    { startTime: null, endTime: null },
    { startTime: "23:59", endTime: null },
  ])("startTime $startTime and endTime $endTime pass", async (times) => {
    await expect(insert(times)).resolves.toMatchObject(times);
  });
});

describe("CalendarEntryPattern", () => {
  test("a resource slotKey with no resource fails CalendarEntryPattern_slotKey_matches_resource", async () => {
    await expectConstraintError(
      prisma.calendarEntryPattern.create({
        data: { ...sessionPatternData(demo), resourceId: null },
      }),
      "CalendarEntryPattern_slotKey_matches_resource",
    );
  });

  test("a resource-less slotKey with a resource fails CalendarEntryPattern_slotKey_matches_resource", async () => {
    await expectConstraintError(
      prisma.calendarEntryPattern.create({
        data: {
          ...sessionPatternData(demo),
          kindId: demo.kinds.allHands.id,
          slotKey: "ALL_HANDS",
        },
      }),
      "CalendarEntryPattern_slotKey_matches_resource",
    );
  });

  test.each([
    { rules: [] },
    { rules: {} },
    { rules: { type: "everyWeekday", weekday: "FRIDAY" } },
  ])(
    "rules $rules fail CalendarEntryPattern_rules_nonempty_array",
    async ({ rules }) => {
      await expectConstraintError(
        prisma.calendarEntryPattern.create({
          data: { ...sessionPatternData(demo), rules },
        }),
        "CalendarEntryPattern_rules_nonempty_array",
      );
    },
  );

  test("a second pattern with the same slot and version fails", async () => {
    await prisma.calendarEntryPattern.create({
      data: sessionPatternData(demo),
    });

    await expectUniqueError(
      prisma.calendarEntryPattern.create({ data: sessionPatternData(demo) }),
    );
  });

  test("the next version of a slot inserts", async () => {
    await prisma.calendarEntryPattern.create({
      data: sessionPatternData(demo),
    });

    await expect(
      prisma.calendarEntryPattern.create({
        data: { ...sessionPatternData(demo), version: 2 },
      }),
    ).resolves.toMatchObject({ version: 2 });
  });
});

describe("CalendarMonthStatusEvent", () => {
  const STATUS_CHANGE = {
    CREATED: { fromStatus: null, toStatus: "DRAFT" },
    PUBLISHED: { fromStatus: "DRAFT", toStatus: "PUBLISHED" },
    UNPUBLISHED: { fromStatus: "PUBLISHED", toStatus: "DRAFT" },
  } as const;
  const event = (type: keyof typeof STATUS_CHANGE) =>
    ({
      monthId: demo.month.id,
      type,
      ...STATUS_CHANGE[type],
      revision: 2,
      actorEmail: AUDIT_EMAIL,
    }) as const;

  test.each(["CREATED", "PUBLISHED", "UNPUBLISHED"] as const)(
    "a %s event inserts",
    async (type) => {
      await expect(
        prisma.calendarMonthStatusEvent.create({ data: event(type) }),
      ).resolves.toMatchObject({ type, actorEmail: AUDIT_EMAIL });
    },
  );

  test("an event for a month that doesn't exist fails CalendarMonthStatusEvent_monthId_fkey", async () => {
    await expectConstraintError(
      prisma.calendarMonthStatusEvent.create({
        data: { ...event("PUBLISHED"), monthId: "missing-month" },
      }),
      "CalendarMonthStatusEvent_monthId_fkey",
    );
  });

  test("deleting a month that has a status event fails CalendarMonthStatusEvent_monthId_fkey", async () => {
    await prisma.calendarMonthStatusEvent.create({ data: event("CREATED") });

    await expectConstraintError(
      prisma.calendarMonth.delete({ where: { id: demo.month.id } }),
      "CalendarMonthStatusEvent_monthId_fkey",
    );
  });
});
