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

import { TRPCClientError } from "@trpc/client";

import {
  currentYearMonth,
  entrySlotKey,
  generateMonthDraft,
  getHolidays,
  parsePatternRules,
  YearMonth,
} from "~@modules/Calendar/rules";
import { getDefaultHolidaySource } from "~@modules/Calendar/rules/holidays/defaultHolidaySource";
import { US_CO_PAROLE_BOARD_RULES } from "~@modules/Calendar/rules/us_co/parole_board";

import { fromDbDate } from "../../../../src/db/dates";
import { createMonths } from "../../../../src/services/createMonths";
import { testPrismaClient } from "../../../setup";
import { AUDIT_EMAIL, OTHER_CALENDAR_CODE } from "../../../setup/fixtures";
import {
  seedCalendarConfig,
  SeededCalendar,
} from "../../../setup/seedCalendarConfig";
import { coEditor } from "../../../setup/users";
import {
  initUsCoClient,
  resolveParoleBoardCalendar,
  US_CO_TEST_CONFIG,
} from "../../../us_co/parole_board/setup";

const calendarCode = "PAROLE_BOARD_PUBLIC";
const EDITOR_EMAIL = "co.editor@example.com";
const october = { year: 2026, month: 10 };
const november = { year: 2026, month: 11 };

async function calendarId(code = calendarCode): Promise<string> {
  const calendar = await testPrismaClient.calendar.findUniqueOrThrow({
    where: { code },
  });
  return calendar.id;
}

async function create(months: YearMonth[]) {
  const client = await initUsCoClient(coEditor);
  return client.Calendar.usCo.paroleBoard.admin.months.create.mutate({
    months,
  });
}

function codeOf(e: unknown): string | undefined {
  return e instanceof TRPCClientError ? e.data?.code : undefined;
}

async function rowCounts() {
  const [months, entries, events] = await Promise.all([
    testPrismaClient.calendarMonth.count(),
    testPrismaClient.calendarEntry.count(),
    testPrismaClient.calendarMonthStatusEvent.count(),
  ]);
  return { months, entries, events };
}

async function entriesOf(id: string, ym: YearMonth) {
  const rows = await testPrismaClient.calendarEntry.findMany({
    where: { month: { calendarId: id, ...ym } },
    orderBy: [{ date: "asc" }, { slotKey: "asc" }],
  });
  return rows.map((row) => ({ ...row, date: fromDbDate(row.date) }));
}

async function addPatternVersion(
  seeded: SeededCalendar,
  id: string,
  resourceCode: string,
  rules: unknown,
) {
  await testPrismaClient.calendarEntryPattern.create({
    data: {
      calendarId: id,
      kindId: seeded.kinds["HEARING"].id,
      resourceId: seeded.resources[resourceCode].id,
      slotKey: entrySlotKey({ kindCode: "HEARING", resourceCode }),
      version: 2,
      rules: rules as never,
      startTime: "08:00",
      endTime: null,
      createdByEmail: AUDIT_EMAIL,
    },
  });
}

let id: string;
let seeded: SeededCalendar;

beforeEach(async () => {
  // America/Denver, Colorado's timezone, is UTC-6 in October.
  vi.useFakeTimers({ toFake: ["Date"], now: new Date("2026-10-08T18:00:00Z") });
  id = await calendarId();
  seeded = await seedCalendarConfig(testPrismaClient, id, US_CO_TEST_CONFIG);
});

afterEach(() => {
  vi.useRealTimers();
});

describe("Calendar.usCo.paroleBoard.admin.months.addOptions", () => {
  it("offers the current month and the next 12, minus existing months", async () => {
    await testPrismaClient.calendarMonth.create({
      data: {
        calendarId: id,
        ...november,
        createdByEmail: AUDIT_EMAIL,
        updatedByEmail: AUDIT_EMAIL,
      },
    });
    const client = await initUsCoClient(coEditor);

    const options =
      await client.Calendar.usCo.paroleBoard.admin.months.addOptions.query();

    expect(options).toEqual([
      october,
      { year: 2026, month: 12 },
      ...Array.from({ length: 10 }, (_, i) => ({ year: 2027, month: i + 1 })),
    ]);
  });

  it("reads the current month in the calendar's timezone", async () => {
    // 2026-11-01T03:00Z is still October 31 in Denver.
    vi.setSystemTime(new Date("2026-11-01T03:00:00Z"));
    const client = await initUsCoClient(coEditor);

    const [first] =
      await client.Calendar.usCo.paroleBoard.admin.months.addOptions.query();

    expect(first).toEqual(october);
  });

  it("ignores another calendar's months", async () => {
    await testPrismaClient.calendarMonth.create({
      data: {
        calendarId: await calendarId(OTHER_CALENDAR_CODE),
        ...october,
        createdByEmail: AUDIT_EMAIL,
        updatedByEmail: AUDIT_EMAIL,
      },
    });
    const client = await initUsCoClient(coEditor);

    const [first] =
      await client.Calendar.usCo.paroleBoard.admin.months.addOptions.query();

    expect(first).toEqual(october);
  });
});

describe("Calendar.usCo.paroleBoard.admin.months.create", () => {
  it("writes a DRAFT month at revision 1 with audit emails and a CREATED event", async () => {
    const result = await create([october]);

    const month = await testPrismaClient.calendarMonth.findUniqueOrThrow({
      where: { id: result.created[0].id },
      include: { statusEvents: true },
    });
    expect(month).toMatchObject({
      calendarId: id,
      ...october,
      status: "DRAFT",
      revision: 1,
      createdByEmail: EDITOR_EMAIL,
      updatedByEmail: EDITOR_EMAIL,
    });
    expect(month.statusEvents).toEqual([
      expect.objectContaining({
        type: "CREATED",
        fromStatus: null,
        toStatus: "DRAFT",
        revision: 1,
        actorEmail: EDITOR_EMAIL,
      }),
    ]);
  });

  it("writes the generator's entries with source PATTERN and version 1", async () => {
    const result = await create([october]);

    const entries = await entriesOf(id, october);
    // Site A's 1st Monday, October 5, is Frances Xavier Cabrini Day, so
    // Colorado's rules move it to the 3rd Thursday, which then has no Full
    // Board. The Business Meeting is on the 3rd Friday.
    expect(
      entries.map(({ date, slotKey, startTime }) => [date, slotKey, startTime]),
    ).toEqual([
      ["2026-10-02", "FULL_BOARD", null],
      ["2026-10-09", "FULL_BOARD", null],
      ["2026-10-13", "HEARING:SITE_B", "09:30"],
      ["2026-10-15", "HEARING:SITE_A", "08:00"],
      ["2026-10-16", "BUSINESS_MEETING", null],
      ["2026-10-16", "FULL_BOARD", null],
      ["2026-10-23", "FULL_BOARD", null],
      ["2026-10-30", "FULL_BOARD", null],
    ]);
    expect(
      entries.every(
        (e) =>
          e.source === "PATTERN" &&
          e.version === 1 &&
          e.cancelledAt === null &&
          e.createdByEmail === EDITOR_EMAIL &&
          e.updatedByEmail === EDITOR_EMAIL,
      ),
    ).toBe(true);
    // Only HEARING counts toward the total, so the meetings don't.
    expect(result.created).toEqual([
      { id: expect.any(String), ...october, entryCount: 2, notices: [] },
    ]);
  });

  it("matches generateMonthDraft for the same inputs", async () => {
    await create([october]);
    const calendar = await resolveParoleBoardCalendar();
    const resources = await testPrismaClient.calendarResource.findMany({
      where: { calendarId: id },
    });
    const patterns = await testPrismaClient.calendarEntryPattern.findMany({
      where: { calendarId: id },
    });

    const draft = generateMonthDraft({
      calendarId: id,
      yearMonth: october,
      rules: US_CO_PAROLE_BOARD_RULES,
      kinds: calendar.kinds,
      resources,
      patterns: patterns.map((p) => ({
        ...p,
        rules: parsePatternRules(p.rules),
      })),
      holidays: getHolidays(getDefaultHolidaySource("US-CO"), {
        start: "2026-10-01",
        end: "2026-10-31",
      }),
    });

    const written = await entriesOf(id, october);
    expect(
      written.map(
        ({ date, kindId, resourceId, slotKey, startTime, endTime }) => ({
          date,
          kindId,
          resourceId,
          slotKey,
          startTime,
          endTime,
        }),
      ),
    ).toEqual(
      expect.arrayContaining(
        draft.entries.map(
          ({ date, kindId, resourceId, slotKey, startTime, endTime }) => ({
            date,
            kindId,
            resourceId,
            slotKey,
            startTime,
            endTime,
          }),
        ),
      ),
    );
    expect(written).toHaveLength(draft.entries.length);
  });

  it("creates no entry on a holiday, and months.get still lists the holiday", async () => {
    await create([october]);
    const client = await initUsCoClient(coEditor);

    const detail =
      await client.Calendar.usCo.paroleBoard.admin.months.get.query({
        ...october,
      });

    // Site A's week-1 Monday is October 5, a holiday, so its hearing is on
    // the 3rd Thursday instead.
    expect(
      detail?.entries
        .filter((e) => e.slotKey === "HEARING:SITE_A")
        .map((e) => e.date),
    ).toEqual(["2026-10-15"]);
    expect(detail?.holidays).toContainEqual({
      date: "2026-10-05",
      name: "Frances Xavier Cabrini Day",
    });
  });

  it("creates no entry at a weekend, which Colorado doesn't allow", async () => {
    await addPatternVersion(seeded, id, "SITE_B", [
      { type: "weekOfMonth", week: 2, weekday: "SATURDAY" },
    ]);

    await create([october]);

    expect(
      (await entriesOf(id, october)).some(
        (e) => e.slotKey === "HEARING:SITE_B",
      ),
    ).toBe(false);
  });

  it("passes on a KIND_WITHOUT_PATTERN notice for a kind with no pattern", async () => {
    await testPrismaClient.calendarEntryPattern.delete({
      where: { id: seeded.patterns["BUSINESS_MEETING"].id },
    });

    const result = await create([october]);

    expect(result.created[0].notices).toEqual([
      expect.objectContaining({
        code: "KIND_WITHOUT_PATTERN",
        kindCode: "BUSINESS_MEETING",
      }),
    ]);
  });

  it("creates several months, then refuses an existing one and writes nothing", async () => {
    const result = await create([november, october]);
    expect(result.created.map(({ year, month }) => ({ year, month }))).toEqual([
      october,
      november,
    ]);
    const before = await rowCounts();

    await expect(
      create([october, { year: 2026, month: 12 }]),
    ).rejects.toMatchObject({
      data: { code: "CONFLICT" },
      message: "October 2026 already exists. Refresh to see it.",
    });
    expect(await rowCounts()).toEqual(before);
  });

  it("names every existing month in the CONFLICT", async () => {
    await create([october, november]);

    await expect(create([october, november])).rejects.toMatchObject({
      message:
        "October 2026 and November 2026 already exist. Refresh to see them.",
    });
  });

  it.each([
    ["a past month", { year: 2026, month: 9 }],
    ["a month 13 ahead", { year: 2027, month: 11 }],
  ])("is BAD_REQUEST for %s", async (_label, ym) => {
    await expect(create([october, ym])).rejects.toMatchObject({
      data: { code: "BAD_REQUEST" },
      message: "You can add October 2026 to October 2027 only.",
    });
    expect((await rowCounts()).months).toBe(0);
  });

  it("is BAD_REQUEST for a repeated month", async () => {
    await expect(create([october, october])).rejects.toMatchObject({
      data: { code: "BAD_REQUEST" },
    });
  });

  it("gives one success and one CONFLICT for two concurrent creates", async () => {
    // Runs only in test-db, against Docker Postgres, because it needs two
    // transactions open at once. On Postgres both requests pass the existence
    // check and the unique (calendarId, year, month) index rejects the second
    // insert. Timing can send a request through the existence check instead,
    // so either CONFLICT passes here; months.create.race.test.ts pins the
    // index path.
    // One client for both, since each initFastifyAndSetUser restarts the server.
    const client = await initUsCoClient(coEditor);
    const results = await Promise.allSettled(
      [1, 2].map(() =>
        client.Calendar.usCo.paroleBoard.admin.months.create.mutate({
          months: [october],
        }),
      ),
    );

    expect(results.map((r) => r.status).sort()).toEqual([
      "fulfilled",
      "rejected",
    ]);
    const rejected = results.find((r) => r.status === "rejected");
    expect(codeOf(rejected?.reason)).toBe("CONFLICT");
    expect(await testPrismaClient.calendarMonth.count({ where: october })).toBe(
      1,
    );
  });

  it("is INTERNAL_SERVER_ERROR for a stored pattern that fails to parse, and writes nothing", async () => {
    await addPatternVersion(seeded, id, "SITE_A", [
      { type: "weekOfMonth", week: 5, weekday: "MONDAY" },
    ]);

    await expect(create([october])).rejects.toMatchObject({
      data: { code: "INTERNAL_SERVER_ERROR" },
    });
    expect(await rowCounts()).toEqual({ months: 0, entries: 0, events: 0 });
  });

  it("gives an inactive resource no entries", async () => {
    await testPrismaClient.calendarResource.update({
      where: { id: seeded.resources["SITE_B"].id },
      data: { isActive: false },
    });

    await create([october]);

    expect(
      (await entriesOf(id, october)).some(
        (e) => e.slotKey === "HEARING:SITE_B",
      ),
    ).toBe(false);
  });

  it("creates a month another calendar already has, and leaves that calendar's rows alone", async () => {
    const otherId = await calendarId(OTHER_CALENDAR_CODE);
    const other = await testPrismaClient.calendarMonth.create({
      data: {
        calendarId: otherId,
        ...october,
        createdByEmail: AUDIT_EMAIL,
        updatedByEmail: AUDIT_EMAIL,
      },
    });

    const result = await create([october]);

    const created = await testPrismaClient.calendarMonth.findUniqueOrThrow({
      where: { id: result.created[0].id },
    });
    expect(created.calendarId).toBe(id);
    expect(
      await testPrismaClient.calendarMonth.findMany({
        where: { calendarId: otherId },
      }),
    ).toEqual([other]);
  });

  it("uses a new pattern version only for months created after it", async () => {
    await create([october]);
    const revisionBefore = (
      await testPrismaClient.calendarMonth.findFirstOrThrow({ where: october })
    ).revision;
    await addPatternVersion(seeded, id, "SITE_A", [
      { type: "weekOfMonth", week: 1, weekday: "TUESDAY" },
    ]);

    await create([november]);

    const siteA = async (ym: YearMonth) =>
      (await entriesOf(id, ym))
        .filter((e) => e.slotKey === "HEARING:SITE_A")
        .map((e) => e.date);
    expect(await siteA(october)).toEqual(["2026-10-15"]);
    expect(await siteA(november)).toEqual(["2026-11-03"]);
    expect(
      (
        await testPrismaClient.calendarMonth.findFirstOrThrow({
          where: october,
        })
      ).revision,
    ).toBe(revisionBefore);
  });
});

describe("createMonths with another adjustDraftMonth", () => {
  it("writes the draft the calendar's rules return", async () => {
    const calendar = await resolveParoleBoardCalendar();
    const result = await createMonths(
      testPrismaClient,
      {
        ...calendar,
        rules: {
          ...calendar.rules,
          adjustDraftMonth: (draft) => ({
            ...draft,
            entries: draft.entries.filter((e) => e.resourceId !== null),
          }),
        },
      },
      EDITOR_EMAIL,
      [currentYearMonth("America/Denver")],
    );

    expect((await entriesOf(id, october)).map((e) => e.slotKey)).toEqual([
      "HEARING:SITE_B",
    ]);
    expect(result.created[0].entryCount).toBe(1);
  });
});
