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

// The Parole Board's drafts: generateMonthDraft with US_CO_REFERENCE_DATA and
// Colorado's rules. Dates were computed outside this code with Monday
// weeks, NTH_WEEKDAY_IN_MONTH and the DHR holiday list.

import { addMonths } from "../../dates";
import { generateMonthDraft } from "../../draft/generateMonthDraft";
import type { GenerateMonthDraftInput, MonthDraft } from "../../draft/types";
// The server's default source, which index.ts leaves out to keep it out of
// browser bundles. Using it keeps these tests on the holidays production
// drafts get, through CO-851's switch to date-holidays.
import { getDefaultHolidaySource } from "../../holidays/defaultHolidaySource";
import { getHolidays } from "../../holidays/getHolidays";
import type { Holiday } from "../../holidays/types";
import type { YearMonth } from "../../types";
import { US_CO_PAROLE_BOARD_RULES } from "./calendar";
import { thirdThursday } from "./generation";
import { US_CO_REFERENCE_DATA } from "./referenceData";

const CALENDAR_ID = "PAROLE_BOARD_PUBLIC";
const { kinds, resources, patterns } = US_CO_REFERENCE_DATA;
const { settings } = US_CO_PAROLE_BOARD_RULES;
const HOLIDAYS = getHolidays(getDefaultHolidaySource(settings.holidayRegion), {
  start: "2026-01-01",
  end: "2027-06-30",
});
const LABELS = new Map(resources.map(({ code, label }) => [code, label]));

/** Ids are the codes, so slotKeys and resourceIds read the same. */
function draftInput(
  yearMonth: YearMonth,
  { holidays = HOLIDAYS }: { holidays?: Holiday[] } = {},
): GenerateMonthDraftInput {
  return {
    calendarId: CALENDAR_ID,
    yearMonth,
    rules: US_CO_PAROLE_BOARD_RULES,
    kinds: kinds.map(({ code, label, sortOrder }) => ({
      id: code,
      calendarId: CALENDAR_ID,
      code,
      label,
      sortOrder,
    })),
    resources: resources.map(({ code, label, sortOrder, isActive }) => ({
      id: code,
      calendarId: CALENDAR_ID,
      code,
      label,
      sortOrder,
      isActive,
    })),
    patterns: patterns.map(
      ({ kindCode, resourceCode, rules, startTime, endTime }) => ({
        kindId: kindCode,
        resourceId: resourceCode,
        rules,
        startTime,
        endTime,
      }),
    ),
    holidays,
  };
}

const SEPTEMBER_2026 = { year: 2026, month: 9 };

const datesOf = (draft: MonthDraft, kindCode: string) =>
  draft.entries
    .filter((entry) => entry.kindCode === kindCode)
    .map(({ date }) => date);

const hearings = (draft: MonthDraft) =>
  draft.entries.filter(({ kindCode }) => kindCode === "HEARING");

/** The hearing labels on each date, in order. */
function hearingsByDate(draft: MonthDraft): Record<string, string[]> {
  const byDate: Record<string, string[]> = {};
  for (const { date, resourceId } of hearings(draft)) {
    (byDate[date] ??= []).push(LABELS.get(resourceId ?? "") ?? "");
  }
  return byDate;
}

describe("thirdThursday", () => {
  it.each([
    [{ year: 2026, month: 9 }, "2026-09-17"],
    [{ year: 2026, month: 10 }, "2026-10-15"],
    [{ year: 2027, month: 2 }, "2027-02-18"],
  ])("finds the 3rd Thursday of %j", (ym, date) => {
    expect(thirdThursday(ym)).toBe(date);
  });
});

describe("generateMonthDraft with US_CO_REFERENCE_DATA and Colorado's rules", () => {
  describe("September 2026", () => {
    const draft = generateMonthDraft(draftInput(SEPTEMBER_2026));

    it("has 43 hearings on 14 dates, with nothing outside the month", () => {
      expect(hearings(draft)).toHaveLength(43);
      expect(new Set(datesOf(draft, "HEARING")).size).toBe(14);
      expect(draft.outsideMonth).toEqual([]);
      expect(draft.holidays).toEqual([
        { date: "2026-09-07", name: "Labor Day" },
      ]);
    });

    it("moves Labor Day's hearings to the 3rd Thursday", () => {
      expect(hearingsByDate(draft)).toEqual({
        "2026-09-01": ["ACC", "Greeley"],
        "2026-09-02": ["CSP", "FMCC"],
        "2026-09-03": ["SCCF", "COSCOM", "Ft. Collins"],
        "2026-09-08": ["CCF", "SCF"],
        "2026-09-09": ["CCF", "SCF"],
        "2026-09-10": ["AVCF", "LVCF"],
        "2026-09-14": ["FCF", "DENCOM WTM BDY"],
        "2026-09-15": ["BVCF", "BVMC"],
        "2026-09-16": ["CCCF", "ISP/DEN ENG"],
        "2026-09-17": [
          "FCF",
          "CTCF",
          "ICC/FED",
          "YOS",
          "CCCF",
          "Boulder",
          "Hilltop",
          "ISP Fremont",
          "ISP/Montrose",
          "ISP Grfld/Mesa",
          "Lamar",
          "SLV",
          "STERCOM",
        ],
        "2026-09-22": ["BCCF", "RCC", "TCF"],
        "2026-09-23": ["RCC", "DWCF"],
        "2026-09-24": ["DCC", "DRDC", "SCC", "ICCS/Pueblo"],
        "2026-09-28": ["BCCF", "LCF"],
      });
    });

    it("has Full Board every Friday and none on the 3rd Thursday", () => {
      expect(datesOf(draft, "FULL_BOARD")).toEqual([
        "2026-09-04",
        "2026-09-11",
        "2026-09-18",
        "2026-09-25",
      ]);
      expect(
        draft.entries.find(({ kindCode }) => kindCode === "FULL_BOARD"),
      ).toEqual({
        date: "2026-09-04",
        kindId: "FULL_BOARD",
        kindCode: "FULL_BOARD",
        resourceId: null,
        slotKey: "FULL_BOARD",
        startTime: null,
        endTime: null,
        source: "PATTERN",
      });
    });

    it("has the Business Meeting on the 3rd Friday, after that day's Full Board", () => {
      expect(
        draft.entries
          .filter(({ date }) => date === "2026-09-18")
          .map(({ slotKey }) => slotKey),
      ).toEqual(["FULL_BOARD", "BUSINESS_MEETING"]);
      expect(draft.notices).toEqual([]);
    });

    it("keeps each location's start time, including on a moved hearing", () => {
      const startTime = (date: string, slotKey: string) =>
        draft.entries.find(
          (entry) => entry.date === date && entry.slotKey === slotKey,
        )?.startTime;

      expect(startTime("2026-09-17", "HEARING:ICC/FED")).toBe("10:00");
      expect(startTime("2026-09-17", "HEARING:STERCOM")).toBe("13:00");
      expect(startTime("2026-09-17", "HEARING:FCF")).toBe("08:00");
    });
  });

  it.each<[string, YearMonth, number, number, string[], string, string]>([
    [
      "October 2026",
      { year: 2026, month: 10 },
      43,
      14,
      ["2026-10-02", "2026-10-09", "2026-10-16", "2026-10-23", "2026-10-30"],
      "2026-10-16",
      // Frances Xavier Cabrini Day, Monday the 5th: FCF and CTCF move to the 15th.
      "2026-10-15",
    ],
    [
      "November 2026",
      { year: 2026, month: 11 },
      37,
      13,
      ["2026-11-06", "2026-11-13", "2026-11-19", "2026-11-20", "2026-11-27"],
      "2026-11-20",
      "",
    ],
    [
      "December 2026",
      { year: 2026, month: 12 },
      43,
      15,
      ["2026-12-04", "2026-12-11", "2026-12-17", "2026-12-18"],
      "2026-12-18",
      "",
    ],
    [
      "February 2027",
      { year: 2027, month: 2 },
      43,
      15,
      // Presidents' Day, Monday the 15th, has no hearings, so the 3rd
      // Thursday keeps its Full Board.
      ["2027-02-05", "2027-02-12", "2027-02-18", "2027-02-19", "2027-02-26"],
      "2027-02-19",
      "",
    ],
    [
      "March 2027",
      { year: 2027, month: 3 },
      43,
      15,
      ["2027-03-05", "2027-03-12", "2027-03-18", "2027-03-19", "2027-03-26"],
      "2027-03-19",
      "",
    ],
    [
      "April 2027",
      { year: 2027, month: 4 },
      43,
      15,
      [
        "2027-04-02",
        "2027-04-09",
        "2027-04-15",
        "2027-04-16",
        "2027-04-23",
        "2027-04-30",
      ],
      "2027-04-16",
      "",
    ],
  ])(
    "drafts %s",
    (
      _name,
      yearMonth,
      hearingCount,
      dateCount,
      fullBoardDates,
      businessMeetingDate,
      movedTo,
    ) => {
      const draft = generateMonthDraft(draftInput(yearMonth));

      expect(hearings(draft)).toHaveLength(hearingCount);
      expect(new Set(datesOf(draft, "HEARING")).size).toBe(dateCount);
      expect(datesOf(draft, "FULL_BOARD")).toEqual(fullBoardDates);
      expect(datesOf(draft, "BUSINESS_MEETING")).toEqual([businessMeetingDate]);
      if (movedTo) {
        expect(hearingsByDate(draft)[movedTo]).toEqual(
          expect.arrayContaining(["FCF", "CTCF"]),
        );
      }
    },
  );

  it("counts April 2027's weeks from its first Thursday, April 1", () => {
    const byDate = hearingsByDate(
      generateMonthDraft(draftInput({ year: 2027, month: 4 })),
    );

    expect(byDate["2027-04-01"]).toEqual(["SCCF", "COSCOM", "Ft. Collins"]);
    expect(byDate["2027-04-05"]).toEqual(["FCF", "CTCF"]);
    expect(byDate["2027-04-22"]).toEqual(["DCC", "DRDC", "SCC", "ICCS/Pueblo"]);
    expect(byDate["2027-04-26"]).toEqual(["BCCF", "LCF"]);
    // A first-full-week count would put the 4th Thursday on April 29.
    expect(byDate["2027-04-29"]).toBeUndefined();
  });

  it("skips November 2026's hearings on Veterans Day and Thanksgiving without moving them", () => {
    const draft = generateMonthDraft(draftInput({ year: 2026, month: 11 }));
    const byDate = hearingsByDate(draft);

    expect(byDate["2026-11-11"]).toBeUndefined();
    expect(byDate["2026-11-26"]).toBeUndefined();
    expect(byDate["2026-11-19"]).not.toEqual(
      expect.arrayContaining(["CCF", "DCC"]),
    );
  });

  describe("the 3rd-Thursday rule", () => {
    it("keeps the Full Board when a Monday holiday has no hearings", () => {
      // A holiday on the 3rd Monday of September 2026, where no location
      // holds hearings, and none on Labor Day.
      const draft = generateMonthDraft(
        draftInput(SEPTEMBER_2026, {
          holidays: [{ date: "2026-09-21", name: "A Monday off" }],
        }),
      );

      expect(datesOf(draft, "FULL_BOARD")).toContain("2026-09-17");
      expect(hearingsByDate(draft)["2026-09-17"]).not.toContain("FCF");
    });

    it("gives way when a Monday holiday moves hearings onto it", () => {
      const draft = generateMonthDraft(draftInput(SEPTEMBER_2026));

      expect(datesOf(draft, "FULL_BOARD")).not.toContain("2026-09-17");
      expect(hearingsByDate(draft)["2026-09-17"]).toEqual(
        expect.arrayContaining(["FCF", "CTCF"]),
      );
    });

    it("moves nothing when the 3rd Thursday is a holiday too, and says so", () => {
      const draft = generateMonthDraft(
        draftInput(SEPTEMBER_2026, {
          holidays: [
            { date: "2026-09-07", name: "Labor Day" },
            { date: "2026-09-17", name: "A Thursday off" },
          ],
        }),
      );

      expect(draft.entries.map(({ date }) => date)).not.toContain("2026-09-17");
      expect(datesOf(draft, "HEARING")).not.toContain("2026-09-07");
      expect(draft.notices).toContainEqual({
        code: "ENTRIES_NOT_MOVED",
        count: 2,
        message:
          "2 moved entries weren't added: FCF and CTCF would fall on Thursday, September 17, a holiday.",
      });
    });

    it("adds the Full Board on the 3rd Thursday with no holidays at all", () => {
      const draft = generateMonthDraft(
        draftInput(SEPTEMBER_2026, { holidays: [] }),
      );

      expect(datesOf(draft, "FULL_BOARD")).toContain("2026-09-17");
      expect(hearings(draft)).toHaveLength(43);
      expect(new Set(datesOf(draft, "HEARING")).size).toBe(15);
    });

    it("doesn't move a hearing onto a 3rd Thursday its location already has, and says so", () => {
      // FCF also holds a 3rd-Thursday hearing, so its Labor Day hearing
      // has nowhere to go.
      const input = draftInput(SEPTEMBER_2026);
      const draft = generateMonthDraft({
        ...input,
        patterns: input.patterns.map((pattern) =>
          pattern.resourceId === "FCF"
            ? {
                ...pattern,
                rules: [
                  ...pattern.rules,
                  { type: "weekOfMonth", week: 3, weekday: "THURSDAY" },
                ],
              }
            : pattern,
        ),
      });

      expect(
        draft.entries.filter(({ slotKey }) => slotKey === "HEARING:FCF"),
      ).toEqual([
        expect.objectContaining({ date: "2026-09-14" }),
        expect.objectContaining({ date: "2026-09-17" }),
      ]);
      expect(draft.notices).toContainEqual({
        code: "ENTRIES_NOT_MOVED",
        count: 1,
        message:
          "1 moved entry wasn't added: FCF is already on Thursday, September 17.",
      });
    });

    it("keeps the Full Board when every moved hearing's location already has the 3rd Thursday", () => {
      // FCF and CTCF also hold 3rd-Thursday hearings, so neither Labor Day
      // hearing moves and the day stays a Full Board day.
      const input = draftInput(SEPTEMBER_2026);
      const draft = generateMonthDraft({
        ...input,
        patterns: input.patterns.map((pattern) =>
          pattern.resourceId === "FCF" || pattern.resourceId === "CTCF"
            ? {
                ...pattern,
                rules: [
                  ...pattern.rules,
                  { type: "weekOfMonth", week: 3, weekday: "THURSDAY" },
                ],
              }
            : pattern,
        ),
      });

      expect(datesOf(draft, "FULL_BOARD")).toContain("2026-09-17");
      expect(draft.notices).toContainEqual({
        code: "ENTRIES_NOT_MOVED",
        count: 2,
        message:
          "2 moved entries weren't added: FCF and CTCF are already on Thursday, September 17.",
      });
    });

    it("adds no 3rd-Thursday Full Board when the calendar has no Full Board pattern", () => {
      const input = draftInput(SEPTEMBER_2026, { holidays: [] });
      const draft = generateMonthDraft({
        ...input,
        patterns: input.patterns.filter(
          ({ kindId }) => kindId !== "FULL_BOARD",
        ),
      });

      expect(datesOf(draft, "FULL_BOARD")).toEqual([]);
    });

    it("moves one hearing when two of a location's rules make the same Monday holiday", () => {
      // Every Monday and the 1st Monday both make Labor Day for FCF.
      const input = draftInput(SEPTEMBER_2026);
      const draft = generateMonthDraft({
        ...input,
        patterns: input.patterns.map((pattern) =>
          pattern.resourceId === "FCF"
            ? {
                ...pattern,
                rules: [
                  ...pattern.rules,
                  { type: "everyWeekday", weekday: "MONDAY" },
                ],
              }
            : pattern,
        ),
      });

      expect(
        draft.entries
          .filter(({ slotKey }) => slotKey === "HEARING:FCF")
          .map(({ date }) => date),
      ).toEqual(["2026-09-14", "2026-09-17", "2026-09-21", "2026-09-28"]);
      expect(draft.notices.map(({ code }) => code)).not.toContain(
        "ENTRIES_NOT_MOVED",
      );
    });
  });

  it("puts nothing on a weekend, even from a pattern that asks for one", () => {
    const input = draftInput(SEPTEMBER_2026);
    const draft = generateMonthDraft({
      ...input,
      patterns: [
        ...input.patterns.filter(({ resourceId }) => resourceId !== "YOS"),
        {
          kindId: "HEARING",
          resourceId: "YOS",
          rules: [{ type: "everyWeekday", weekday: "SATURDAY" }],
          startTime: null,
          endTime: null,
        },
      ],
    });

    expect(
      draft.entries.filter(({ slotKey }) => slotKey === "HEARING:YOS"),
    ).toEqual([]);
  });

  it("keeps every entry in its month with unique (date, slotKey), 2026 to 2035", () => {
    let yearMonth: YearMonth = { year: 2026, month: 1 };
    while (yearMonth.year <= 2035) {
      const draft = generateMonthDraft(draftInput(yearMonth));
      const prefix = `${yearMonth.year}-${String(yearMonth.month).padStart(2, "0")}-`;
      const keys = draft.entries.map(
        ({ date, slotKey }) => `${date} ${slotKey}`,
      );

      expect(
        draft.entries.filter(({ date }) => !date.startsWith(prefix)),
      ).toEqual([]);
      expect(draft.outsideMonth).toEqual([]);
      expect(new Set(keys).size).toBe(keys.length);
      yearMonth = addMonths(yearMonth, 1);
    }
  });
});
