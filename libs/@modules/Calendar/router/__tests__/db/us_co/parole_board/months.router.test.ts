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

import { toDbDate } from "../../../../src/db/dates";
import { testPrismaClient } from "../../../setup";
import { AUDIT_EMAIL, OTHER_CALENDAR_CODE } from "../../../setup/fixtures";
import {
  seedCalendarConfig,
  SeededCalendar,
} from "../../../setup/seedCalendarConfig";
import { coEditor, idUser, recidivizUser } from "../../../setup/users";
import {
  initUsCoClient,
  US_CO_TEST_CONFIG,
} from "../../../us_co/parole_board/setup";

const calendarCode = "PAROLE_BOARD_PUBLIC";
const audit = { createdByEmail: AUDIT_EMAIL, updatedByEmail: AUDIT_EMAIL };

async function calendarId(code = calendarCode): Promise<string> {
  const calendar = await testPrismaClient.calendar.findUniqueOrThrow({
    where: { code },
  });
  return calendar.id;
}

async function createMonth(
  id: string,
  year: number,
  month: number,
  data: {
    updatedByEmail?: string;
    revision?: number;
    status?: "DRAFT" | "PUBLISHED";
  } = {},
) {
  return testPrismaClient.calendarMonth.create({
    data: { calendarId: id, year, month, ...audit, ...data },
  });
}

/**
 * Records a publish the way months.publish does: the month goes to PUBLISHED,
 * its revision goes up by 1, and it gets a PUBLISHED status event at the new
 * revision.
 */
async function publish(
  monthId: string,
  publishedAt: Date,
  actorEmail = "publisher-1@example.com",
) {
  const month = await testPrismaClient.calendarMonth.update({
    where: { id: monthId },
    data: { status: "PUBLISHED", revision: { increment: 1 } },
  });
  return testPrismaClient.calendarMonthStatusEvent.create({
    data: {
      monthId,
      type: "PUBLISHED",
      fromStatus: "DRAFT",
      toStatus: "PUBLISHED",
      revision: month.revision,
      createdAt: publishedAt,
      actorEmail,
    },
  });
}

/** Records an Edit month click: the month goes back to DRAFT at revision + 1. */
async function unpublish(monthId: string, unpublishedAt: Date) {
  const month = await testPrismaClient.calendarMonth.update({
    where: { id: monthId },
    data: { status: "DRAFT", revision: { increment: 1 } },
  });
  return testPrismaClient.calendarMonthStatusEvent.create({
    data: {
      monthId,
      type: "UNPUBLISHED",
      fromStatus: "PUBLISHED",
      toStatus: "DRAFT",
      revision: month.revision,
      createdAt: unpublishedAt,
      actorEmail: "editor-1@example.com",
    },
  });
}

describe("Calendar.usCo.paroleBoard.admin.months.list", () => {
  // months.list leaves out months before the current one, so the clock
  // (Date only) starts before every month these tests create.
  beforeEach(() => {
    vi.useFakeTimers({ toFake: ["Date"] });
    vi.setSystemTime(new Date("2026-01-15T12:00:00Z"));
  });
  afterEach(() => vi.useRealTimers());

  it("returns the first page in ascending order across a year boundary", async () => {
    const id = await calendarId();
    await createMonth(id, 2027, 1);
    await createMonth(id, 2026, 12, { updatedByEmail: "editor-1@example.com" });
    await createMonth(id, 2026, 9);
    const client = await initUsCoClient(coEditor);

    const { items: months } =
      await client.Calendar.usCo.paroleBoard.admin.months.list.query({});

    expect(months.map((m) => [m.year, m.month])).toEqual([
      [2026, 9],
      [2026, 12],
      [2027, 1],
    ]);
    expect(months[1]).toMatchObject({
      status: "DRAFT",
      revision: 1,
      lastEditedByEmail: "editor-1@example.com",
      latestPublication: null,
    });
    expect(months[1].lastEditedAt).toBeInstanceOf(Date);
  });

  it("returns each month's newest PUBLISHED event as its latestPublication", async () => {
    const id = await calendarId();
    const published = await createMonth(id, 2026, 10);
    await createMonth(id, 2026, 11);
    await publish(published.id, new Date("2026-09-20T15:00:00Z"));
    await unpublish(published.id, new Date("2026-09-22T15:00:00Z"));
    await publish(
      published.id,
      new Date("2026-09-25T15:00:00Z"),
      "publisher-2@example.com",
    );
    const client = await initUsCoClient(coEditor);

    const { items } =
      await client.Calendar.usCo.paroleBoard.admin.months.list.query({});

    expect(items).toMatchObject([
      {
        month: 10,
        status: "PUBLISHED",
        latestPublication: {
          publishedAt: new Date("2026-09-25T15:00:00Z"),
          publishedByEmail: "publisher-2@example.com",
        },
      },
      { month: 11, status: "DRAFT", latestPublication: null },
    ]);
  });
});

describe("Calendar.usCo.paroleBoard.admin.months.get", () => {
  let seeded: SeededCalendar;
  let id: string;

  beforeEach(async () => {
    id = await calendarId();
    seeded = await seedCalendarConfig(testPrismaClient, id, US_CO_TEST_CONFIG);
  });

  function entry(
    monthId: string,
    date: string,
    kindCode: string,
    resourceCode: string | null,
  ) {
    return testPrismaClient.calendarEntry.create({
      data: {
        calendarId: id,
        monthId,
        date: toDbDate(date),
        kindId: seeded.kinds[kindCode].id,
        resourceId: resourceCode ? seeded.resources[resourceCode].id : null,
        slotKey: resourceCode ? `${kindCode}:${resourceCode}` : kindCode,
        source: "PATTERN",
        ...audit,
      },
    });
  }

  it("returns null for a month that doesn't exist", async () => {
    const client = await initUsCoClient(coEditor);

    await expect(
      client.Calendar.usCo.paroleBoard.admin.months.get.query({
        year: 2026,
        month: 11,
      }),
    ).resolves.toBeNull();
  });

  it("orders entries by date, kind sortOrder, then resource sortOrder", async () => {
    const month = await createMonth(id, 2026, 9);
    // Inserted out of order, so only the sort can produce the expected order.
    await entry(month.id, "2026-09-04", "FULL_BOARD", null);
    await entry(month.id, "2026-09-04", "HEARING", "SITE_B");
    await entry(month.id, "2026-09-04", "HEARING", "SITE_A");
    await entry(month.id, "2026-09-01", "HEARING", "SITE_B");
    const client = await initUsCoClient(coEditor);

    const detail =
      await client.Calendar.usCo.paroleBoard.admin.months.get.query({
        year: 2026,
        month: 9,
      });

    expect(detail?.entries.map((e) => [e.date, e.label])).toEqual([
      ["2026-09-01", "Site B"],
      ["2026-09-04", "Site A"],
      ["2026-09-04", "Site B"],
      ["2026-09-04", "Full Board"],
    ]);
  });

  it("maps each entry's fields", async () => {
    const month = await createMonth(id, 2026, 9);
    const session = await entry(month.id, "2026-09-01", "HEARING", "SITE_A");
    const meeting = await entry(month.id, "2026-09-04", "FULL_BOARD", null);
    const cancelledAt = new Date("2026-08-30T12:00:00Z");
    await testPrismaClient.calendarEntry.update({
      where: { id: meeting.id },
      data: {
        cancelledAt,
        cancelledByEmail: "editor-1@example.com",
        version: 2,
        source: "MANUAL",
        startTime: "09:00",
        endTime: "10:30",
      },
    });
    const client = await initUsCoClient(coEditor);

    const detail =
      await client.Calendar.usCo.paroleBoard.admin.months.get.query({
        year: 2026,
        month: 9,
      });

    expect(detail?.entries).toEqual([
      {
        id: session.id,
        date: "2026-09-01",
        kind: {
          code: "HEARING",
          label: "Hearing",
          cancellable: false,
          deletable: true,
          countsTowardTotal: true,
        },
        label: "Site A",
        resource: {
          id: seeded.resources["SITE_A"].id,
          code: "SITE_A",
          label: "Site A",
          typeCode: "SITE",
        },
        slotKey: "HEARING:SITE_A",
        startTime: null,
        endTime: null,
        source: "PATTERN",
        cancelled: false,
        cancelledAt: null,
        cancelledByEmail: null,
        holidayName: null,
        version: 1,
        updatedAt: expect.any(Date),
        updatedByEmail: AUDIT_EMAIL,
      },
      expect.objectContaining({
        id: meeting.id,
        label: "Full Board",
        resource: null,
        slotKey: "FULL_BOARD",
        startTime: "09:00",
        endTime: "10:30",
        source: "MANUAL",
        cancelled: true,
        cancelledAt,
        cancelledByEmail: "editor-1@example.com",
        version: 2,
      }),
    ]);
  });

  it("counts uncancelled entries whose kind counts toward the total", async () => {
    const month = await createMonth(id, 2026, 9);
    await entry(month.id, "2026-09-01", "HEARING", "SITE_A");
    await entry(month.id, "2026-09-01", "HEARING", "SITE_B");
    await entry(month.id, "2026-09-08", "HEARING", "SITE_A");
    const cancelled = await entry(month.id, "2026-09-15", "HEARING", "SITE_A");
    await testPrismaClient.calendarEntry.update({
      where: { id: cancelled.id },
      data: {
        cancelledAt: new Date("2026-08-30T12:00:00Z"),
        cancelledByEmail: "editor-1@example.com",
      },
    });
    await entry(month.id, "2026-09-04", "FULL_BOARD", null);
    await entry(month.id, "2026-09-11", "FULL_BOARD", null);
    const client = await initUsCoClient(coEditor);

    const detail =
      await client.Calendar.usCo.paroleBoard.admin.months.get.query({
        year: 2026,
        month: 9,
      });

    expect(detail?.counts).toEqual({ entryDays: 2, entryCount: 3 });
  });

  it("flags an entry on a Colorado holiday and lists the month's holidays", async () => {
    const month = await createMonth(id, 2026, 9);
    await entry(month.id, "2026-09-07", "HEARING", "SITE_A");
    await entry(month.id, "2026-09-08", "HEARING", "SITE_A");
    const client = await initUsCoClient(coEditor);

    const detail =
      await client.Calendar.usCo.paroleBoard.admin.months.get.query({
        year: 2026,
        month: 9,
      });

    expect(detail?.holidays).toEqual([
      { date: "2026-09-07", name: "Labor Day" },
    ]);
    expect(detail?.entries.map((e) => e.holidayName)).toEqual([
      "Labor Day",
      null,
    ]);
  });

  it("returns the month's fields", async () => {
    const month = await createMonth(id, 2026, 9, { revision: 5 });
    const client = await initUsCoClient(coEditor);

    const detail =
      await client.Calendar.usCo.paroleBoard.admin.months.get.query({
        year: 2026,
        month: 9,
      });

    expect(detail).toMatchObject({
      id: month.id,
      year: 2026,
      month: 9,
      status: "DRAFT",
      revision: 5,
      lastEditedByEmail: AUDIT_EMAIL,
      entries: [],
      counts: { entryDays: 0, entryCount: 0 },
    });
  });
});

describe("Calendar.usCo.paroleBoard.admin.months.get latestPublication", () => {
  let id: string;

  beforeEach(async () => {
    id = await calendarId();
  });

  async function getLatestPublication() {
    const client = await initUsCoClient(coEditor);
    const detail =
      await client.Calendar.usCo.paroleBoard.admin.months.get.query({
        year: 2026,
        month: 9,
      });
    return {
      status: detail?.status,
      latestPublication: detail?.latestPublication,
    };
  }

  it("is null for a month that has never been published", async () => {
    const month = await createMonth(id, 2026, 9);
    await testPrismaClient.calendarMonthStatusEvent.create({
      data: {
        monthId: month.id,
        type: "CREATED",
        toStatus: "DRAFT",
        revision: 1,
        actorEmail: AUDIT_EMAIL,
      },
    });

    expect(await getLatestPublication()).toEqual({
      status: "DRAFT",
      latestPublication: null,
    });
  });

  it("comes from the newest PUBLISHED event", async () => {
    const month = await createMonth(id, 2026, 9);
    await publish(month.id, new Date("2026-08-20T15:00:00Z"));
    await unpublish(month.id, new Date("2026-08-22T15:00:00Z"));
    await publish(
      month.id,
      new Date("2026-08-25T15:00:00Z"),
      "publisher-2@example.com",
    );

    expect(await getLatestPublication()).toEqual({
      status: "PUBLISHED",
      latestPublication: {
        publishedAt: new Date("2026-08-25T15:00:00Z"),
        publishedByEmail: "publisher-2@example.com",
      },
    });
  });

  it("takes the higher revision when two PUBLISHED events share a createdAt", async () => {
    const month = await createMonth(id, 2026, 9);
    const publishedAt = new Date("2026-08-20T15:00:00Z");
    await publish(month.id, publishedAt);
    await unpublish(month.id, publishedAt);
    await publish(month.id, publishedAt, "publisher-2@example.com");

    expect((await getLatestPublication()).latestPublication).toEqual({
      publishedAt,
      publishedByEmail: "publisher-2@example.com",
    });
  });

  it("stays set while the month is back in DRAFT", async () => {
    const month = await createMonth(id, 2026, 9);
    await publish(month.id, new Date("2026-08-20T15:00:00Z"));
    await unpublish(month.id, new Date("2026-08-22T15:00:00Z"));

    expect(await getLatestPublication()).toEqual({
      status: "DRAFT",
      latestPublication: {
        publishedAt: new Date("2026-08-20T15:00:00Z"),
        publishedByEmail: "publisher-1@example.com",
      },
    });
  });
});

describe("calendar and state isolation", () => {
  // months.list leaves out months before the current one, so the clock
  // (Date only) starts before every month these tests create.
  beforeEach(() => {
    vi.useFakeTimers({ toFake: ["Date"] });
    vi.setSystemTime(new Date("2026-01-15T12:00:00Z"));
  });
  afterEach(() => vi.useRealTimers());

  beforeEach(async () => {
    await createMonth(await calendarId(calendarCode), 2026, 9, {
      updatedByEmail: "co-editor@example.com",
    });
    await createMonth(await calendarId(OTHER_CALENDAR_CODE), 2026, 9, {
      updatedByEmail: "other-editor@example.com",
    });
  });

  it("never shows a US_CO editor another calendar's month", async () => {
    const client = await initUsCoClient(coEditor);

    const { items: months } =
      await client.Calendar.usCo.paroleBoard.admin.months.list.query({});
    const detail =
      await client.Calendar.usCo.paroleBoard.admin.months.get.query({
        year: 2026,
        month: 9,
      });

    expect(months.map((m) => m.lastEditedByEmail)).toEqual([
      "co-editor@example.com",
    ]);
    expect(detail?.lastEditedByEmail).toBe("co-editor@example.com");
  });

  it("shows a Recidiviz user, who may act in any state, only US_CO's month", async () => {
    const client = await initUsCoClient(recidivizUser);

    const { items: months } =
      await client.Calendar.usCo.paroleBoard.admin.months.list.query({});
    const detail =
      await client.Calendar.usCo.paroleBoard.admin.months.get.query({
        year: 2026,
        month: 9,
      });

    expect(months.map((m) => m.lastEditedByEmail)).toEqual([
      "co-editor@example.com",
    ]);
    expect(detail?.lastEditedByEmail).toBe("co-editor@example.com");
  });

  it.each([
    ["a US_ID editor", idUser],
    ["a Recidiviz user", recidivizUser],
  ])("is FORBIDDEN for %s acting in US_ID", async (_label, user) => {
    const client = await initUsCoClient(user, { stateCode: "US_ID" });

    await expect(
      client.Calendar.usCo.paroleBoard.admin.months.list.query({}),
    ).rejects.toMatchObject({ data: { code: "FORBIDDEN" } });
  });
});
