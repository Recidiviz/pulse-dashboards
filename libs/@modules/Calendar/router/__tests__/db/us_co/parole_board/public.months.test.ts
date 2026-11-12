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
import { addEntry } from "../../../../src/services/entries";
import {
  publishMonth,
  unpublishMonth,
} from "../../../../src/services/monthStatus";
import { getPublicMonth } from "../../../../src/services/publicMonths";
import { testPrismaClient } from "../../../setup";
import { AUDIT_EMAIL, OTHER_CALENDAR_CODE } from "../../../setup/fixtures";
import {
  seedCalendarConfig,
  SeededCalendar,
} from "../../../setup/seedCalendarConfig";
import { idUser } from "../../../setup/users";
import {
  initUsCoClient,
  paroleBoardCalendarId,
  resolveParoleBoardCalendar,
  US_CO_TEST_CONFIG,
} from "../../../us_co/parole_board/setup";

// Synthetic months and entries in Colorado's shape. A published month gets a
// Site A hearing on the 1st and a cancelled Full Board on the 2nd.
const audit = { createdByEmail: AUDIT_EMAIL, updatedByEmail: AUDIT_EMAIL };
const EDITOR_EMAIL = "editor-1@example.com";
/** 2026-10-15 at noon in America/Denver. */
const MID_OCTOBER = new Date("2026-10-15T18:00:00Z");

const seededByCalendar = new Map<string, SeededCalendar>();

async function seeded(calendarId: string): Promise<SeededCalendar> {
  let config = seededByCalendar.get(calendarId);
  if (!config) {
    config = await seedCalendarConfig(
      testPrismaClient,
      calendarId,
      US_CO_TEST_CONFIG,
    );
    seededByCalendar.set(calendarId, config);
  }
  return config;
}

function ymd(year: number, month: number, day: number): string {
  return `${year}-${String(month).padStart(2, "0")}-${String(day).padStart(2, "0")}`;
}

interface MonthOptions {
  status?: "DRAFT" | "PUBLISHED";
  calendarId?: string;
}

/** Creates a month with a hearing on the 1st and a cancelled Full Board on the 2nd. */
async function createMonth(
  year: number,
  month: number,
  { status = "PUBLISHED", calendarId }: MonthOptions = {},
) {
  const id = calendarId ?? (await paroleBoardCalendarId());
  const config = await seeded(id);
  const row = await testPrismaClient.calendarMonth.create({
    data: { calendarId: id, year, month, revision: 2, status, ...audit },
  });
  await testPrismaClient.calendarEntry.createMany({
    data: [
      {
        calendarId: id,
        monthId: row.id,
        date: toDbDate(ymd(year, month, 1)),
        kindId: config.kinds["HEARING"].id,
        resourceId: config.resources["SITE_A"].id,
        slotKey: "HEARING:SITE_A",
        source: "PATTERN",
        startTime: "08:00",
        ...audit,
      },
      {
        calendarId: id,
        monthId: row.id,
        date: toDbDate(ymd(year, month, 2)),
        kindId: config.kinds["FULL_BOARD"].id,
        resourceId: null,
        slotKey: "FULL_BOARD",
        source: "PATTERN",
        cancelledAt: new Date("2026-09-20T16:00:00Z"),
        cancelledByEmail: EDITOR_EMAIL,
        ...audit,
      },
    ],
  });
  return row;
}

/** Reads as the public does: no token and no StateCode header. */
async function read(input: { month?: string } = {}) {
  const client = await initUsCoClient(undefined, {
    omitAuth: true,
    omitStateCode: true,
  });
  return client.Calendar.usCo.paroleBoard.public.months.get.query(input);
}

beforeEach(() => {
  // Each test starts from an empty database, so seed the config again.
  seededByCalendar.clear();
  vi.useFakeTimers({ toFake: ["Date"], now: MID_OCTOBER });
});

afterEach(() => {
  vi.useRealTimers();
});

describe("Calendar.usCo.paroleBoard.public.months.get", () => {
  it("lands on the current month when it's published", async () => {
    await createMonth(2026, 9);
    await createMonth(2026, 10);
    await createMonth(2026, 11);

    const result = await read();

    expect(result).toMatchObject({
      month: "2026-10",
      title: "October 2026",
      previous: "2026-09",
      next: "2026-11",
      notPublishedYet: null,
    });
    expect(result?.days).toHaveLength(31);
    expect(result?.days.slice(0, 3)).toEqual([
      {
        date: "2026-10-01",
        holidayName: null,
        entries: [{ label: "Site A", kind: "HEARING", cancelled: false }],
      },
      {
        date: "2026-10-02",
        holidayName: null,
        entries: [{ label: "Full Board", kind: "FULL_BOARD", cancelled: true }],
      },
      { date: "2026-10-03", holidayName: null, entries: [] },
    ]);
  });

  it("takes the current month in America/Denver, not UTC", async () => {
    // 2026-11-01T05:00Z is still October 31 in Denver.
    vi.setSystemTime(new Date("2026-11-01T05:00:00Z"));
    await createMonth(2026, 10);
    await createMonth(2026, 11);

    expect(await read()).toMatchObject({ month: "2026-10" });
  });

  it("lands on the nearest later month, naming the unpublished current month", async () => {
    await createMonth(2026, 8);
    await createMonth(2026, 10, { status: "DRAFT" });
    await createMonth(2026, 12);
    await createMonth(2027, 1);

    expect(await read()).toMatchObject({
      month: "2026-12",
      title: "December 2026",
      previous: "2026-08",
      next: "2027-01",
      notPublishedYet: "October 2026",
    });
  });

  it("lands on the nearest earlier month when nothing later is published", async () => {
    await createMonth(2026, 7);
    await createMonth(2026, 8);
    await createMonth(2026, 11, { status: "DRAFT" });

    expect(await read()).toMatchObject({
      month: "2026-08",
      previous: "2026-07",
      next: null,
      notPublishedYet: null,
    });
  });

  it("returns null when nothing is published", async () => {
    await createMonth(2026, 10, { status: "DRAFT" });
    await createMonth(2026, 11, { status: "DRAFT" });

    expect(await read()).toBeNull();
  });

  it("skips a DRAFT month in previous and next, across a year end", async () => {
    await createMonth(2026, 12);
    await createMonth(2027, 1, { status: "DRAFT" });
    await createMonth(2027, 2);

    expect(await read({ month: "2026-12" })).toMatchObject({
      previous: null,
      next: "2027-02",
    });
    expect(await read({ month: "2027-02" })).toMatchObject({
      previous: "2026-12",
      next: null,
    });
    await expect(read({ month: "2027-01" })).rejects.toMatchObject({
      data: { code: "NOT_FOUND" },
      message: "This month isn't available.",
    });
  });

  it("returns null neighbours for the first and last published months", async () => {
    await createMonth(2026, 9);
    await createMonth(2026, 11);

    expect(await read({ month: "2026-09" })).toMatchObject({
      previous: null,
      next: "2026-11",
    });
    expect(await read({ month: "2026-11" })).toMatchObject({
      previous: "2026-09",
      next: null,
    });
  });

  describe("after Edit month", () => {
    async function publishedThenBackInDraft() {
      const month = await createMonth(2026, 10, { status: "DRAFT" });
      const calendar = await resolveParoleBoardCalendar();
      await publishMonth(testPrismaClient, calendar, {
        monthId: month.id,
        expectedRevision: 2,
        email: EDITOR_EMAIL,
      });
      await unpublishMonth(testPrismaClient, calendar, {
        monthId: month.id,
        email: EDITOR_EMAIL,
      });
      return { month, calendar };
    }

    it("is NOT_FOUND for a month back in DRAFT", async () => {
      await publishedThenBackInDraft();

      await expect(read({ month: "2026-10" })).rejects.toMatchObject({
        data: { code: "NOT_FOUND" },
        message: "This month isn't available.",
      });
      expect(await read()).toBeNull();
    });

    it("shows an entry added after Edit month once the month is republished", async () => {
      const { month, calendar } = await publishedThenBackInDraft();
      const config = await seeded(calendar.id);
      const { monthRevision } = await addEntry(
        testPrismaClient,
        calendar,
        EDITOR_EMAIL,
        {
          monthId: month.id,
          date: "2026-10-06",
          kindCode: "HEARING",
          resourceId: config.resources["SITE_B"].id,
        },
      );
      await publishMonth(testPrismaClient, calendar, {
        monthId: month.id,
        expectedRevision: monthRevision,
        email: EDITOR_EMAIL,
      });

      const result = await read({ month: "2026-10" });

      expect(result?.days[5].entries).toEqual([
        { label: "Site B", kind: "HEARING", cancelled: false },
      ]);
    });
  });

  it.each([
    ["a never-published month", "2026-10"],
    ["a month the calendar doesn't have", "2030-01"],
  ])("is NOT_FOUND for %s", async (_label, month) => {
    await createMonth(2026, 9);
    await createMonth(2026, 10, { status: "DRAFT" });

    await expect(read({ month })).rejects.toMatchObject({
      data: { code: "NOT_FOUND" },
      message: "This month isn't available.",
    });
  });

  it("never shows another calendar's months", async () => {
    const otherCalendarId = await paroleBoardCalendarId(OTHER_CALENDAR_CODE);
    await createMonth(2026, 10, { calendarId: otherCalendarId });

    expect(await read()).toBeNull();
    await expect(read({ month: "2026-10" })).rejects.toMatchObject({
      data: { code: "NOT_FOUND" },
    });
  });

  it("answers the same for a signed-in user of another state", async () => {
    await createMonth(2026, 10);
    const client = await initUsCoClient(idUser, { stateCode: "US_ID" });

    expect(
      await client.Calendar.usCo.paroleBoard.public.months.get.query({}),
    ).toMatchObject({
      month: "2026-10",
    });
  });

  it("carries no ids, emails or revision data", async () => {
    const month = await createMonth(2026, 10);
    await createMonth(2026, 11);
    const entries = await testPrismaClient.calendarEntry.findMany({
      where: { monthId: month.id },
    });

    const result = await read();
    const json = JSON.stringify(result);

    expect(Object.keys(result ?? {}).sort()).toEqual([
      "days",
      "month",
      "next",
      "notPublishedYet",
      "previous",
      "title",
    ]);
    for (const day of result?.days ?? []) {
      expect(Object.keys(day).sort()).toEqual([
        "date",
        "entries",
        "holidayName",
      ]);
      for (const entry of day.entries) {
        expect(Object.keys(entry).sort()).toEqual([
          "cancelled",
          "kind",
          "label",
        ]);
      }
    }
    for (const secret of [
      month.id,
      month.calendarId,
      ...entries.map((entry) => entry.id),
      EDITOR_EMAIL,
      AUDIT_EMAIL,
      "08:00",
      "@",
    ]) {
      expect(json).not.toContain(secret);
    }
  });
});

describe("getPublicMonth", () => {
  it("leaves out entries of a kind that isn't public", async () => {
    await createMonth(2026, 10);
    const calendar = await resolveParoleBoardCalendar();
    const kinds = calendar.kinds.map((kind) =>
      kind.code === "FULL_BOARD" ? { ...kind, isPublic: false } : kind,
    );

    const result = await getPublicMonth(
      testPrismaClient,
      { ...calendar, kinds },
      { month: "2026-10" },
    );

    expect(result?.days[0].entries).toHaveLength(1);
    expect(result?.days[1].entries).toEqual([]);
  });

  it("is NOT_FOUND when Edit month lands while it reads the entries", async () => {
    const month = await createMonth(2026, 10);
    const calendar = await resolveParoleBoardCalendar();
    // Moves the month back to DRAFT right after the entries are read.
    const racing = new Proxy(testPrismaClient, {
      get: (target, key) =>
        key === "calendarEntry"
          ? {
              findMany: async (args: object) => {
                const entries = await target.calendarEntry.findMany(args);
                await target.calendarMonth.update({
                  where: { id: month.id },
                  data: { status: "DRAFT", revision: { increment: 1 } },
                });
                return entries;
              },
            }
          : Reflect.get(target, key),
    });

    await expect(
      getPublicMonth(racing, calendar, { month: "2026-10" }),
    ).rejects.toMatchObject({ code: "NOT_FOUND" });
  });
});
