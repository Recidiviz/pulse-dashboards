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

import { readFileSync } from "node:fs";
import { join } from "node:path";

import type { CalendarRules } from "../calendarRules";
import {
  CalendarSettings,
  PatternRule,
  Weekday,
  WEEKDAYS,
  WeekOfMonth,
} from "../types";
import { generateMonthDraft, sortDraftEntries } from "./generateMonthDraft";
import {
  DraftEntry,
  DraftKind,
  DraftPattern,
  DraftResource,
  GenerateMonthDraftInput,
  MonthDraft,
} from "./types";

// A synthetic calendar: a clinic where each room holds visits on its own
// weeks, all staff meet every Friday, and reviews have no schedule yet.
const CALENDAR_ID = "cal-clinic";

const SETTINGS: CalendarSettings = {
  weekStartsOn: "SUNDAY",
  allowedWeekdays: [...WEEKDAYS],
  weekNumbering: "FIRST_FULL_WEEK",
  timezone: "America/Denver",
  holidayRegion: "US-CO",
  holidayPolicy: "WARN",
  editorRoute: "clinicCalendar",
};

function entryType(code: string, requiresResource: boolean) {
  return {
    code,
    requiresResource,
    cancellable: !requiresResource,
    deletable: true,
    isPublic: true,
    countsTowardTotal: requiresResource,
  };
}

/** The clinic's rules, as its own code would give them to the engine. */
const RULES: CalendarRules = {
  settings: SETTINGS,
  entryTypes: [
    entryType("VISIT", true),
    entryType("STAFF_MEETING", false),
    entryType("REVIEW", false),
  ],
};

/** RULES with some settings changed. */
function rulesWith(settings: Partial<CalendarSettings>): CalendarRules {
  return { ...RULES, settings: { ...SETTINGS, ...settings } };
}

function kind(code: string, label: string, sortOrder: number): DraftKind {
  return {
    id: `kind-${code}`,
    calendarId: CALENDAR_ID,
    code,
    label,
    sortOrder,
  };
}

const VISIT = kind("VISIT", "Visit", 1);
const STAFF_MEETING = kind("STAFF_MEETING", "Staff meeting", 2);
const REVIEW = kind("REVIEW", "Review", 3);

function resource(code: string, sortOrder: number): DraftResource {
  return {
    id: `res-${code}`,
    calendarId: CALENDAR_ID,
    code,
    label: `Room ${code}`,
    sortOrder,
    isActive: true,
  };
}

// Sort orders deliberately disagree with code order.
const ROOM_B = resource("B", 10);
const ROOM_A = resource("A", 20);
const ROOM_C = resource("C", 30);

function weekOfMonth(week: WeekOfMonth, weekday: Weekday): PatternRule {
  return { type: "weekOfMonth", week, weekday };
}

function visits(
  room: DraftResource,
  rules: PatternRule[],
  startTime: string | null = "09:00",
): DraftPattern {
  return {
    kindId: VISIT.id,
    resourceId: room.id,
    rules,
    startTime,
    endTime: null,
  };
}

const STAFF_MEETING_PATTERN: DraftPattern = {
  kindId: STAFF_MEETING.id,
  resourceId: null,
  rules: [{ type: "everyWeekday", weekday: "FRIDAY" }],
  startTime: null,
  endTime: null,
};

/** September 2026, Sunday weeks: week 1 is Sep 6 to 12, week 4 is Sep 27 to Oct 3. */
function input(
  overrides: Partial<GenerateMonthDraftInput> = {},
): GenerateMonthDraftInput {
  return {
    calendarId: CALENDAR_ID,
    yearMonth: { year: 2026, month: 9 },
    rules: RULES,
    kinds: [VISIT, STAFF_MEETING, REVIEW],
    resources: [ROOM_A, ROOM_B, ROOM_C],
    patterns: [
      visits(ROOM_A, [weekOfMonth(1, "MONDAY"), weekOfMonth(2, "MONDAY")]),
      visits(ROOM_B, [weekOfMonth(1, "MONDAY")], "13:00"),
      STAFF_MEETING_PATTERN,
    ],
    holidays: [
      { date: "2026-08-31", name: "Outside the month" },
      { date: "2026-09-07", name: "Labor Day" },
    ],
    ...overrides,
  };
}

function rows(draft: MonthDraft) {
  return draft.entries.map(({ date, slotKey }) => `${date} ${slotKey}`);
}

function invalidDraftInput(messagePart: string) {
  return expect.objectContaining({
    code: "INVALID_DRAFT_INPUT",
    message: expect.stringContaining(messagePart),
  });
}

/** A pattern entry with no times. */
function entry(
  date: string,
  draftKind: DraftKind,
  room: DraftResource | null,
): DraftEntry {
  return {
    date,
    kindId: draftKind.id,
    kindCode: draftKind.code,
    resourceId: room?.id ?? null,
    slotKey: room ? `${draftKind.code}:${room.code}` : draftKind.code,
    startTime: null,
    endTime: null,
    source: "PATTERN",
  };
}

describe("sortDraftEntries", () => {
  it("orders by date, then kind sortOrder, then resource sortOrder", () => {
    const sorted = sortDraftEntries(
      [
        entry("2026-09-15", VISIT, ROOM_A),
        entry("2026-09-14", REVIEW, null),
        entry("2026-09-14", STAFF_MEETING, null),
        entry("2026-09-14", VISIT, ROOM_C),
        entry("2026-09-14", VISIT, ROOM_A),
        entry("2026-09-14", VISIT, ROOM_B),
      ],
      input(),
    );

    expect(sorted.map(({ date, slotKey }) => `${date} ${slotKey}`)).toEqual([
      "2026-09-14 VISIT:B",
      "2026-09-14 VISIT:A",
      "2026-09-14 VISIT:C",
      "2026-09-14 STAFF_MEETING",
      "2026-09-14 REVIEW",
      "2026-09-15 VISIT:A",
    ]);
  });

  it("breaks a tie on slotKey", () => {
    const sorted = sortDraftEntries(
      [
        { ...entry("2026-09-14", VISIT, null), slotKey: "VISIT:Z" },
        { ...entry("2026-09-14", VISIT, null), slotKey: "VISIT:Y" },
      ],
      input(),
    );

    expect(sorted.map(({ slotKey }) => slotKey)).toEqual([
      "VISIT:Y",
      "VISIT:Z",
    ]);
  });
});

describe("generateMonthDraft", () => {
  it("expands each pattern into sorted entries, skipping holidays", () => {
    const draft = generateMonthDraft(input());

    // Labor Day (Sep 7) would have held both rooms' week-1 visits.
    expect(rows(draft)).toEqual([
      "2026-09-04 STAFF_MEETING",
      "2026-09-11 STAFF_MEETING",
      "2026-09-14 VISIT:A",
      "2026-09-18 STAFF_MEETING",
      "2026-09-25 STAFF_MEETING",
    ]);
    expect(draft.entries[2]).toEqual({
      date: "2026-09-14",
      kindId: VISIT.id,
      kindCode: "VISIT",
      resourceId: ROOM_A.id,
      slotKey: "VISIT:A",
      startTime: "09:00",
      endTime: null,
      source: "PATTERN",
    });
    expect(draft.entries[0]).toMatchObject({
      resourceId: null,
      startTime: null,
    });
    expect(draft.holidays).toEqual([{ date: "2026-09-07", name: "Labor Day" }]);
    expect(draft.outsideMonth).toEqual([]);
  });

  it("orders entries on one day by kind sortOrder, then resource sortOrder", () => {
    const draft = generateMonthDraft(input({ holidays: [] }));

    expect(rows(draft).slice(0, 3)).toEqual([
      "2026-09-04 STAFF_MEETING",
      "2026-09-07 VISIT:B",
      "2026-09-07 VISIT:A",
    ]);
  });

  it("adds a KIND_WITHOUT_PATTERN notice for each kind with no pattern, in sortOrder", () => {
    const { notices } = generateMonthDraft(
      input({ kinds: [REVIEW, VISIT, STAFF_MEETING], patterns: [] }),
    );

    expect(notices).toEqual([
      {
        code: "KIND_WITHOUT_PATTERN",
        kindCode: "VISIT",
        message:
          "Visit entries weren't added because their schedule isn't set yet. Add them by hand if this month needs any.",
      },
      expect.objectContaining({ kindCode: "STAFF_MEETING" }),
      expect.objectContaining({ kindCode: "REVIEW" }),
    ]);
  });

  it("adds no KIND_WITHOUT_PATTERN notice once the kind has a pattern", () => {
    const reviewPattern: DraftPattern = {
      kindId: REVIEW.id,
      resourceId: null,
      rules: [
        {
          type: "everyNWeeks",
          weekday: "FRIDAY",
          intervalWeeks: 3,
          anchorDate: "2026-09-04",
        },
      ],
      startTime: "15:00",
      endTime: "16:00",
    };
    const draft = generateMonthDraft(
      input({
        kinds: [STAFF_MEETING, REVIEW],
        patterns: [STAFF_MEETING_PATTERN, reviewPattern],
      }),
    );

    expect(draft.notices).toEqual([]);
    // Two kinds on one day both appear, in kind order.
    expect(rows(draft)).toEqual([
      "2026-09-04 STAFF_MEETING",
      "2026-09-04 REVIEW",
      "2026-09-11 STAFF_MEETING",
      "2026-09-18 STAFF_MEETING",
      "2026-09-25 STAFF_MEETING",
      "2026-09-25 REVIEW",
    ]);
  });

  it("leaves dates past month end out of the entries and lists them", () => {
    const draft = generateMonthDraft(
      input({
        patterns: [
          visits(ROOM_A, [
            weekOfMonth(4, "THURSDAY"),
            weekOfMonth(4, "MONDAY"),
          ]),
        ],
      }),
    );

    expect(rows(draft)).toEqual(["2026-09-28 VISIT:A"]);
    expect(draft.outsideMonth).toEqual([
      {
        date: "2026-10-01",
        kindId: VISIT.id,
        kindCode: "VISIT",
        resourceId: ROOM_A.id,
        slotKey: "VISIT:A",
        label: "Room A",
        rule: weekOfMonth(4, "THURSDAY"),
        startTime: "09:00",
        endTime: null,
      },
    ]);
    expect(draft.notices).toContainEqual({
      code: "ENTRIES_OUTSIDE_MONTH",
      count: 1,
      message:
        "1 visit falls after September ends and wasn't added: Room A on Thursday, October 1.",
    });
  });

  it("groups the outside-month notice by date and joins labels", () => {
    // February 2027 with Sunday weeks: week 4 is Feb 28 to Mar 6.
    const draft = generateMonthDraft(
      input({
        yearMonth: { year: 2027, month: 2 },
        patterns: [
          visits(ROOM_A, [weekOfMonth(4, "MONDAY"), weekOfMonth(4, "TUESDAY")]),
          visits(ROOM_B, [weekOfMonth(4, "MONDAY")]),
          visits(ROOM_C, [weekOfMonth(4, "MONDAY")]),
        ],
      }),
    );

    expect(draft.entries).toEqual([]);
    expect(draft.outsideMonth.map(({ label }) => label)).toEqual([
      "Room B",
      "Room A",
      "Room C",
      "Room A",
    ]);
    expect(draft.notices).toContainEqual(
      expect.objectContaining({
        code: "ENTRIES_OUTSIDE_MONTH",
        count: 4,
        message:
          "4 visits fall after February ends and weren't added: Room B, Room A, and Room C on Monday, March 1; Room A on Tuesday, March 2.",
      }),
    );
  });

  it('calls the outside-month rows "entries" when they mix kinds', () => {
    const draft = generateMonthDraft(
      input({
        patterns: [
          visits(ROOM_A, [weekOfMonth(4, "THURSDAY")]),
          { ...STAFF_MEETING_PATTERN, rules: [weekOfMonth(4, "FRIDAY")] },
        ],
      }),
    );

    expect(draft.notices).toContainEqual(
      expect.objectContaining({
        message:
          "2 entries fall after September ends and weren't added: Room A on Thursday, October 1; Staff meeting on Friday, October 2.",
      }),
    );
  });

  it("follows weekNumbering from the settings", () => {
    const draft = generateMonthDraft(
      input({
        rules: rulesWith({ weekNumbering: "NTH_WEEKDAY_IN_MONTH" }),
        patterns: [visits(ROOM_A, [weekOfMonth(4, "THURSDAY")])],
      }),
    );

    expect(rows(draft)).toEqual(["2026-09-24 VISIT:A"]);
    expect(draft.outsideMonth).toEqual([]);
  });

  it("follows weekStartsOn from the settings", () => {
    // With Monday weeks, week 1 of September 2026 starts Monday Sep 7.
    const draft = generateMonthDraft(
      input({
        rules: rulesWith({ weekStartsOn: "MONDAY" }),
        patterns: [visits(ROOM_A, [weekOfMonth(1, "SUNDAY")])],
      }),
    );

    expect(rows(draft)).toEqual(["2026-09-13 VISIT:A"]);
  });

  it("makes one entry when two rules of a pattern land on one date", () => {
    const draft = generateMonthDraft(
      input({
        patterns: [
          visits(ROOM_A, [
            { type: "everyWeekday", weekday: "FRIDAY" },
            weekOfMonth(1, "FRIDAY"),
          ]),
        ],
      }),
    );

    expect(rows(draft)).toEqual([
      "2026-09-04 VISIT:A",
      "2026-09-11 VISIT:A",
      "2026-09-18 VISIT:A",
      "2026-09-25 VISIT:A",
    ]);
  });

  it("makes no entries for a pattern on an inactive resource, or a resource with no pattern", () => {
    const draft = generateMonthDraft(
      input({
        resources: [ROOM_A, { ...ROOM_B, isActive: false }, ROOM_C],
        patterns: [visits(ROOM_B, [weekOfMonth(1, "MONDAY")])],
      }),
    );

    expect(draft.entries).toEqual([]);
    // The kind still has a pattern, so there's no notice for it.
    expect(draft.notices).not.toContainEqual(
      expect.objectContaining({ kindCode: "VISIT" }),
    );
  });

  it("leaves every holiday out and keeps every other date", () => {
    const withHolidays = generateMonthDraft(
      input({
        holidays: [
          { date: "2026-09-07", name: "Labor Day" },
          { date: "2026-09-11", name: "Extra day off" },
        ],
      }),
    );
    const withoutHolidays = generateMonthDraft(input({ holidays: [] }));

    expect(withoutHolidays.holidays).toEqual([]);
    expect(withHolidays.entries).toEqual(
      withoutHolidays.entries.filter(
        ({ date }) => date !== "2026-09-07" && date !== "2026-09-11",
      ),
    );
    expect(withHolidays.notices).toEqual(withoutHolidays.notices);
  });

  it("skips the weekdays the settings don't allow, including next-month dates", () => {
    const draft = generateMonthDraft(
      input({
        rules: rulesWith({
          allowedWeekdays: ["MONDAY", "TUESDAY", "WEDNESDAY", "THURSDAY"],
        }),
        holidays: [],
        patterns: [
          visits(ROOM_A, [weekOfMonth(4, "FRIDAY"), weekOfMonth(4, "MONDAY")]),
          STAFF_MEETING_PATTERN,
        ],
      }),
    );

    // Week 4 is Sep 27 to Oct 3: its Friday is in October and isn't allowed.
    expect(rows(draft)).toEqual(["2026-09-28 VISIT:A"]);
    expect(draft.outsideMonth).toEqual([]);
    expect(draft.notices).not.toContainEqual(
      expect.objectContaining({ code: "ENTRIES_OUTSIDE_MONTH" }),
    );
  });

  it("joins two holiday names on one date", () => {
    const draft = generateMonthDraft(
      input({
        holidays: [
          { date: "2026-09-07", name: "Labor Day" },
          { date: "2026-09-07", name: "Founders' Day" },
        ],
      }),
    );

    expect(draft.holidays).toEqual([
      { date: "2026-09-07", name: "Labor Day / Founders' Day" },
    ]);
  });

  it("gives deep-equal output for the same input", () => {
    expect(generateMonthDraft(input())).toEqual(generateMonthDraft(input()));
  });

  it("returns the rules' adjustDraftMonth result on the generated draft", () => {
    const adjustDraftMonth = vi.fn((draft: MonthDraft) => ({
      ...draft,
      entries: draft.entries.slice(0, 1),
    }));
    const draftInput = input({ rules: { ...RULES, adjustDraftMonth } });

    const draft = generateMonthDraft(draftInput);

    expect(adjustDraftMonth).toHaveBeenCalledWith(
      generateMonthDraft(input()),
      draftInput,
    );
    expect(rows(draft)).toEqual(["2026-09-04 STAFF_MEETING"]);
  });

  describe("invalid input", () => {
    it.each<[string, Partial<GenerateMonthDraftInput>, string]>([
      ["a month 13", { yearMonth: { year: 2026, month: 13 } }, "yearMonth"],
      [
        "a kind with no entry type in the rules",
        { kinds: [VISIT, STAFF_MEETING, kind("AUDIT", "Audit", 4)] },
        "Kind AUDIT has no entry type in the calendar's rules",
      ],
      [
        "two kinds with one code",
        { kinds: [VISIT, { ...REVIEW, code: "VISIT" }] },
        "Two kinds have code VISIT",
      ],
      [
        "two kinds with one id",
        { kinds: [VISIT, { ...REVIEW, id: VISIT.id }] },
        `Two kinds have id ${VISIT.id}`,
      ],
      [
        "two resources with one code",
        { resources: [ROOM_A, { ...ROOM_B, code: "A" }] },
        "Two resources have code A",
      ],
      [
        "two resources with one id",
        { resources: [ROOM_A, { ...ROOM_B, id: ROOM_A.id }] },
        `Two resources have id ${ROOM_A.id}`,
      ],
      [
        "two patterns with one slotKey",
        {
          patterns: [
            visits(ROOM_A, [weekOfMonth(1, "MONDAY")]),
            visits(ROOM_A, [weekOfMonth(2, "MONDAY")]),
          ],
        },
        "Two patterns have slotKey VISIT:A",
      ],
      [
        "a pattern with an unknown kind",
        { patterns: [{ ...STAFF_MEETING_PATTERN, kindId: "kind-NOPE" }] },
        "unknown kind kind-NOPE",
      ],
      [
        "a pattern with an unknown resource",
        { patterns: [{ ...visits(ROOM_A, []), resourceId: "res-NOPE" }] },
        "unknown resource res-NOPE",
      ],
      [
        "a kind that requires a resource with none",
        {
          patterns: [
            { ...visits(ROOM_A, [weekOfMonth(1, "MONDAY")]), resourceId: null },
          ],
        },
        "Pattern VISIT: Kind VISIT requires a resource",
      ],
      [
        "a kind with no resource given one",
        { patterns: [{ ...STAFF_MEETING_PATTERN, resourceId: ROOM_A.id }] },
        "Pattern STAFF_MEETING:A",
      ],
      [
        "a resource from another calendar",
        {
          resources: [{ ...ROOM_A, calendarId: "cal-other" }],
          patterns: [visits(ROOM_A, [weekOfMonth(1, "MONDAY")])],
        },
        "Pattern VISIT:A: Resource A belongs to another calendar",
      ],
      [
        "an everyNWeeks anchor off its weekday",
        {
          patterns: [
            {
              ...STAFF_MEETING_PATTERN,
              rules: [
                {
                  type: "everyNWeeks",
                  weekday: "FRIDAY",
                  intervalWeeks: 3,
                  anchorDate: "2026-09-03",
                },
              ],
            },
          ],
        },
        "Pattern STAFF_MEETING: Invalid pattern rules",
      ],
      [
        "a pattern with no rules",
        { patterns: [visits(ROOM_A, [])] },
        "Pattern VISIT:A: Invalid pattern rules",
      ],
      [
        "a start time that isn't HH:mm",
        { patterns: [visits(ROOM_A, [weekOfMonth(1, "MONDAY")], "9:00")] },
        'Pattern VISIT:A: expected an HH:mm time, got "9:00"',
      ],
      [
        "an end time with no start time",
        {
          patterns: [
            { ...STAFF_MEETING_PATTERN, startTime: null, endTime: "10:00" },
          ],
        },
        "Pattern STAFF_MEETING: endTime needs a startTime",
      ],
      [
        "an end time before the start time",
        {
          patterns: [
            { ...STAFF_MEETING_PATTERN, startTime: "10:00", endTime: "09:30" },
          ],
        },
        "Pattern STAFF_MEETING: endTime needs a startTime",
      ],
      [
        "a holiday that isn't a real date",
        { holidays: [{ date: "2026-09-31", name: "Typo Day" }] },
        "Holidays",
      ],
    ])("throws INVALID_DRAFT_INPUT for %s", (_name, overrides, messagePart) => {
      expect(() => generateMonthDraft(input(overrides))).toThrow(
        invalidDraftInput(messagePart),
      );
    });

    it("checks patterns on inactive resources too", () => {
      expect(() =>
        generateMonthDraft(
          input({
            resources: [{ ...ROOM_A, isActive: false }],
            patterns: [visits(ROOM_A, [weekOfMonth(1, "MONDAY")], "25:00")],
          }),
        ),
      ).toThrow(invalidDraftInput("Pattern VISIT:A"));
    });
  });

  it("names no kind code or state in the generator source", () => {
    // Every kind's dates come from its patterns, so a new kind needs no code change.
    for (const file of ["generateMonthDraft.ts", "notices.ts"]) {
      const source = readFileSync(join(__dirname, file), "utf8");
      expect(source).not.toMatch(
        /HEARING|FULL_BOARD|BUSINESS_MEETING|US_CO|Colorado/,
      );
    }
  });
});
