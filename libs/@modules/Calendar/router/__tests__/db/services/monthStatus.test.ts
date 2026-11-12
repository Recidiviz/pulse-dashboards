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

import type { CalendarPrismaClient } from "~@modules/Calendar/prisma";
import type { CalendarRules } from "~@modules/Calendar/rules";

import { toDbDate } from "../../../src/db/dates";
import type { ResolvedCalendar } from "../../../src/procedures";
import { addEntry } from "../../../src/services/entries";
import {
  getPublishPreview,
  publishMonth,
  unpublishMonth,
} from "../../../src/services/monthStatus";
import { testPrismaClient } from "../../setup";
import { TEST_RULES } from "../../setup/calendarConfig";
import { AUDIT_EMAIL } from "../../setup/fixtures";
import {
  seedCalendarConfig,
  SeededCalendar,
} from "../../setup/seedCalendarConfig";

/**
 * The engine's publish with a synthetic calendar's rules, for a setting no
 * state's API uses today: holidayPolicy BLOCK.
 */

const audit = { createdByEmail: AUDIT_EMAIL, updatedByEmail: AUDIT_EMAIL };
const EDITOR = "editor-1@example.com";

/** The test calendar's rules with US-CO holidays, so 2026-09-07 is Labor Day. */
function rulesWith(holidayPolicy: "WARN" | "BLOCK"): CalendarRules {
  return {
    ...TEST_RULES,
    settings: { ...TEST_RULES.settings, holidayRegion: "US-CO", holidayPolicy },
  };
}

let seeded: SeededCalendar;
let monthId: string;

async function resolved(rules: CalendarRules): Promise<ResolvedCalendar> {
  const row = await testPrismaClient.calendar.findUniqueOrThrow({
    where: { code: "TEST_CALENDAR" },
  });
  return {
    id: row.id,
    stateCode: "US_CO",
    code: row.code,
    name: row.name,
    rules,
    kinds: Object.values(seeded.kinds)
      .sort((a, b) => a.sortOrder - b.sortOrder)
      .flatMap((kind) =>
        rules.entryTypes
          .filter((type) => type.code === kind.code)
          .map((type) => ({ ...kind, ...type })),
      ),
  };
}

function createEntry(
  date: string,
  kindCode: string,
  resourceCode: string | null,
) {
  return testPrismaClient.calendarEntry.create({
    data: {
      calendarId: seeded.kinds[kindCode].calendarId,
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

/** The test client, except every transaction fails as a lost connection would. */
function failingClient(): CalendarPrismaClient {
  return new Proxy(testPrismaClient, {
    get: (target, key) =>
      key === "$transaction"
        ? () => Promise.reject(new Error("connection lost"))
        : Reflect.get(target, key),
  });
}

beforeEach(async () => {
  const row = await testPrismaClient.calendar.findUniqueOrThrow({
    where: { code: "TEST_CALENDAR" },
  });
  seeded = await seedCalendarConfig(testPrismaClient, row.id);
  ({ id: monthId } = await testPrismaClient.calendarMonth.create({
    data: { calendarId: row.id, year: 2026, month: 9, revision: 3, ...audit },
  }));
  await createEntry("2026-09-07", "SESSION", "SITE_A");
  await createEntry("2026-09-14", "SESSION", "SITE_A");
});

describe("publishMonth under holidayPolicy BLOCK", () => {
  it("is PRECONDITION_FAILED naming the entry and holiday, and writes nothing", async () => {
    const calendar = await resolved(rulesWith("BLOCK"));

    await expect(
      publishMonth(testPrismaClient, calendar, {
        monthId,
        expectedRevision: 3,
        email: EDITOR,
      }),
    ).rejects.toMatchObject({
      code: "PRECONDITION_FAILED",
      message:
        "September 2026 has entries on holidays. Move or delete them before publishing: Site A on September 7 (Labor Day).",
    });
    expect(
      await testPrismaClient.calendarMonth.findUniqueOrThrow({
        where: { id: monthId },
      }),
    ).toMatchObject({ status: "DRAFT", revision: 3 });
    expect(await testPrismaClient.calendarMonthStatusEvent.count()).toBe(0);
  });

  it("still lists the entry in the preview's warnings", async () => {
    const calendar = await resolved(rulesWith("BLOCK"));

    const preview = await getPublishPreview(
      testPrismaClient,
      calendar,
      monthId,
    );

    expect(preview.holidayWarnings).toEqual([
      expect.objectContaining({ date: "2026-09-07", label: "Site A" }),
    ]);
  });

  it("publishes once the entry is off the holiday", async () => {
    await testPrismaClient.calendarEntry.updateMany({
      where: { monthId, date: toDbDate("2026-09-07") },
      data: { date: toDbDate("2026-09-08") },
    });
    const calendar = await resolved(rulesWith("BLOCK"));

    const result = await publishMonth(testPrismaClient, calendar, {
      monthId,
      expectedRevision: 3,
      email: EDITOR,
    });

    expect(result.status).toBe("PUBLISHED");
  });

  it("neither warns about nor blocks a cancelled entry on a holiday", async () => {
    await testPrismaClient.calendarEntry.updateMany({
      where: { monthId, date: toDbDate("2026-09-07") },
      data: { date: toDbDate("2026-09-08") },
    });
    const cancelled = await createEntry("2026-09-07", "STAFF_MEETING", null);
    await testPrismaClient.calendarEntry.update({
      where: { id: cancelled.id },
      data: { cancelledAt: new Date(), cancelledByEmail: EDITOR },
    });
    const calendar = await resolved(rulesWith("BLOCK"));

    const preview = await getPublishPreview(
      testPrismaClient,
      calendar,
      monthId,
    );
    const result = await publishMonth(testPrismaClient, calendar, {
      monthId,
      expectedRevision: 3,
      email: EDITOR,
    });

    expect(preview.holidayWarnings).toEqual([]);
    expect(result.status).toBe("PUBLISHED");
  });

  it("refuses to republish an entry added on a holiday after Edit month", async () => {
    await testPrismaClient.calendarEntry.updateMany({
      where: { monthId, date: toDbDate("2026-09-07") },
      data: { date: toDbDate("2026-09-08") },
    });
    const calendar = await resolved(rulesWith("BLOCK"));
    await publishMonth(testPrismaClient, calendar, {
      monthId,
      expectedRevision: 3,
      email: EDITOR,
    });
    await unpublishMonth(testPrismaClient, calendar, {
      monthId,
      email: EDITOR,
    });
    const { monthRevision } = await addEntry(
      testPrismaClient,
      calendar,
      EDITOR,
      {
        monthId,
        date: "2026-09-07",
        kindCode: "SESSION",
        resourceId: seeded.resources["SITE_B"].id,
      },
    );

    await expect(
      publishMonth(testPrismaClient, calendar, {
        monthId,
        expectedRevision: monthRevision,
        email: EDITOR,
      }),
    ).rejects.toMatchObject({
      code: "PRECONDITION_FAILED",
      message:
        "September 2026 has entries on holidays. Move or delete them before publishing: Site B on September 7 (Labor Day).",
    });
    expect(
      await testPrismaClient.calendarMonth.findUniqueOrThrow({
        where: { id: monthId },
      }),
    ).toMatchObject({ status: "DRAFT", revision: monthRevision });
  });
});

describe("publishMonth's failures", () => {
  it("is INTERNAL_SERVER_ERROR with the PRD copy when the write fails, and leaves the month DRAFT", async () => {
    const calendar = await resolved(rulesWith("WARN"));
    await expect(
      publishMonth(failingClient(), calendar, {
        monthId,
        expectedRevision: 3,
        email: EDITOR,
      }),
    ).rejects.toMatchObject({
      code: "INTERNAL_SERVER_ERROR",
      message:
        "September 2026 wasn't published. The public calendar hasn't changed. Try again or contact Recidiviz support.",
    });
    expect(
      await testPrismaClient.calendarMonth.findUniqueOrThrow({
        where: { id: monthId },
      }),
    ).toMatchObject({ status: "DRAFT", revision: 3 });
    expect(await testPrismaClient.calendarMonthStatusEvent.count()).toBe(0);
  });
});

describe("unpublishMonth's failures", () => {
  it("is INTERNAL_SERVER_ERROR without the database's message when the write fails, and leaves the month PUBLISHED", async () => {
    const calendar = await resolved(rulesWith("WARN"));
    await publishMonth(testPrismaClient, calendar, {
      monthId,
      expectedRevision: 3,
      email: EDITOR,
    });
    await expect(
      unpublishMonth(failingClient(), calendar, {
        monthId,
        email: EDITOR,
      }),
    ).rejects.toMatchObject({
      code: "INTERNAL_SERVER_ERROR",
      message:
        "September 2026 is still published. Try Edit month again or contact Recidiviz support.",
    });
    expect(
      await testPrismaClient.calendarMonth.findUniqueOrThrow({
        where: { id: monthId },
      }),
    ).toMatchObject({ status: "PUBLISHED", revision: 4 });
  });
});
