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

import type { ResolvedCalendar } from "../../../src/procedures";
import { addEntry, moveEntries } from "../../../src/services/entries";
import { runMonthMutation } from "../../../src/services/entryMutations";
import { testPrismaClient } from "../../setup";
import { TEST_RULES } from "../../setup/calendarConfig";
import { AUDIT_EMAIL } from "../../setup/fixtures";
import { seedCalendarConfig } from "../../setup/seedCalendarConfig";

/** The synthetic calendar as its procedures would resolve it, with its rows seeded. */
async function resolveTestCalendar(): Promise<ResolvedCalendar> {
  const row = await testPrismaClient.calendar.findUniqueOrThrow({
    where: { code: "TEST_CALENDAR" },
  });
  const seeded = await seedCalendarConfig(testPrismaClient, row.id);
  return {
    id: row.id,
    stateCode: "US_CO",
    code: row.code,
    name: row.name,
    rules: TEST_RULES,
    kinds: Object.values(seeded.kinds).flatMap((kind) =>
      TEST_RULES.entryTypes
        .filter((type) => type.code === kind.code)
        .map((type) => ({ ...kind, ...type })),
    ),
  };
}

/** The synthetic calendar with a DRAFT September 2026 at revision 1. */
async function resolvedTestCalendar() {
  const calendar = await resolveTestCalendar();
  const month = await testPrismaClient.calendarMonth.create({
    data: {
      calendarId: calendar.id,
      year: 2026,
      month: 9,
      createdByEmail: AUDIT_EMAIL,
      updatedByEmail: AUDIT_EMAIL,
    },
  });
  return { calendar, month };
}

/**
 * The engine's entry writes with a synthetic calendar's rules, for settings
 * no state's API uses today.
 */
describe("addEntry and moveEntries on a calendar whose settings allow every day", () => {
  it("adds on a weekend", async () => {
    const { calendar, month } = await resolvedTestCalendar();

    const { entry, month: updated } = await addEntry(
      testPrismaClient,
      calendar,
      "editor-1@example.com",
      {
        monthId: month.id,
        date: "2026-09-13",
        kindCode: "STAFF_MEETING",
        resourceId: null,
      },
    );

    expect(entry).toMatchObject({
      date: "2026-09-13",
      slotKey: "STAFF_MEETING",
    });
    expect(updated).toMatchObject({ id: month.id, revision: 2 });
    expect(updated.entries.map(({ id }) => id)).toEqual([entry.id]);
  });

  it("is INTERNAL_SERVER_ERROR when no holiday source covers the region, and writes nothing", async () => {
    const resolved = await resolveTestCalendar();
    const calendar: ResolvedCalendar = {
      ...resolved,
      rules: {
        ...resolved.rules,
        settings: { ...resolved.rules.settings, holidayRegion: "US-ZZ" },
      },
    };
    const month = await testPrismaClient.calendarMonth.create({
      data: {
        calendarId: calendar.id,
        year: 2026,
        month: 9,
        createdByEmail: AUDIT_EMAIL,
        updatedByEmail: AUDIT_EMAIL,
      },
    });

    await expect(
      addEntry(testPrismaClient, calendar, "editor-1@example.com", {
        monthId: month.id,
        date: "2026-09-13",
        kindCode: "STAFF_MEETING",
        resourceId: null,
      }),
    ).rejects.toMatchObject({ code: "INTERNAL_SERVER_ERROR" });
    expect(
      await testPrismaClient.calendarMonth.findUniqueOrThrow({
        where: { id: month.id },
      }),
    ).toMatchObject({ revision: 1, updatedByEmail: AUDIT_EMAIL });
    expect(
      await testPrismaClient.calendarEntry.count({
        where: { monthId: month.id },
      }),
    ).toBe(0);
  });

  it("moves to a weekend", async () => {
    const { calendar, month } = await resolvedTestCalendar();
    const { entry } = await addEntry(
      testPrismaClient,
      calendar,
      "editor-1@example.com",
      {
        monthId: month.id,
        date: "2026-09-11",
        kindCode: "STAFF_MEETING",
        resourceId: null,
      },
    );

    const { entries, month: updated } = await moveEntries(
      testPrismaClient,
      calendar,
      "editor-1@example.com",
      {
        entries: [{ entryId: entry.id, expectedVersion: 1 }],
        newDate: "2026-09-12",
      },
    );

    expect(entries[0]).toMatchObject({ date: "2026-09-12", version: 2 });
    expect(updated).toMatchObject({ id: month.id, revision: 3 });
    expect(updated.entries).toEqual([entries[0]]);
  });
});

/**
 * runMonthMutation's guard, which the services' own published-month check
 * runs before. It is what rejects a write when a publish commits between a
 * service's read and its transaction.
 */
describe("runMonthMutation", () => {
  async function createMonth(status: "DRAFT" | "PUBLISHED") {
    const calendar = await resolveTestCalendar();
    const month = await testPrismaClient.calendarMonth.create({
      data: {
        calendarId: calendar.id,
        year: 2026,
        month: 9,
        status,
        revision: 3,
        createdByEmail: AUDIT_EMAIL,
        updatedByEmail: AUDIT_EMAIL,
      },
    });
    return { calendar, month };
  }

  it("bumps a DRAFT month's revision, runs the write and reads the month after it", async () => {
    const { calendar, month } = await createMonth("DRAFT");
    const write = vi.fn().mockResolvedValue("written");

    await expect(
      runMonthMutation(
        testPrismaClient,
        { calendar, monthId: month.id, email: "editor-1@example.com" },
        write,
      ),
    ).resolves.toEqual({
      result: "written",
      monthRevision: 4,
      month: expect.objectContaining({
        id: month.id,
        revision: 4,
        lastEditedByEmail: "editor-1@example.com",
        entries: [],
      }),
    });
    expect(write).toHaveBeenCalledOnce();
  });

  it("is PRECONDITION_FAILED for a PUBLISHED month, without running the write or bumping the revision", async () => {
    const { calendar, month } = await createMonth("PUBLISHED");
    const write = vi.fn();

    await expect(
      runMonthMutation(
        testPrismaClient,
        { calendar, monthId: month.id, email: "editor-1@example.com" },
        write,
      ),
    ).rejects.toMatchObject({
      code: "PRECONDITION_FAILED",
      message: "September 2026 is published. Click Edit month to change it.",
    });
    expect(write).not.toHaveBeenCalled();
    expect(
      await testPrismaClient.calendarMonth.findUniqueOrThrow({
        where: { id: month.id },
      }),
    ).toMatchObject({ revision: 3, updatedByEmail: AUDIT_EMAIL });
  });

  it("is NOT_FOUND for a month outside the calendar", async () => {
    const { calendar, month } = await createMonth("DRAFT");
    const write = vi.fn();

    await expect(
      runMonthMutation(
        testPrismaClient,
        {
          calendar: { ...calendar, id: "another-calendar" },
          monthId: month.id,
          email: "editor-1@example.com",
        },
        write,
      ),
    ).rejects.toMatchObject({ code: "NOT_FOUND" });
    expect(write).not.toHaveBeenCalled();
  });
});
