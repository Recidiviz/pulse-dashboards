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

import { calendarConfigSchema, parseCalendarConfig } from "./calendarConfig";

const HEARING = { code: "HEARING", label: "Hearing", sortOrder: 1 };
const FULL_BOARD = { code: "FULL_BOARD", label: "Full Board", sortOrder: 2 };
const FCF = {
  code: "FCF",
  typeCode: "FACILITY",
  label: "FCF",
  name: "FREMONT",
  sortOrder: 1,
  isActive: true,
};
const FCF_PATTERN = {
  kindCode: "HEARING",
  resourceCode: "FCF",
  rules: [
    { type: "weekOfMonth", week: 1, weekday: "MONDAY" },
    { type: "weekOfMonth", week: 2, weekday: "MONDAY" },
  ],
  startTime: "08:00",
  endTime: null,
};
const FULL_BOARD_PATTERN = {
  kindCode: "FULL_BOARD",
  resourceCode: null,
  rules: [{ type: "everyWeekday", weekday: "FRIDAY" }],
  startTime: null,
  endTime: null,
};

/** A small configuration with one row of each kind. */
const MINIMAL_CONFIG = {
  calendar: {
    code: "TEST_CALENDAR",
    name: "Test hearing calendar",
  },
  resourceTypes: [{ code: "FACILITY", label: "Facility", sortOrder: 1 }],
  resources: [FCF],
  kinds: [HEARING, FULL_BOARD],
  patterns: [FCF_PATTERN, FULL_BOARD_PATTERN],
};

function withChanges(changes: Record<string, unknown>) {
  return { ...MINIMAL_CONFIG, ...changes };
}

function withCalendar(changes: Record<string, unknown>) {
  return withChanges({
    calendar: { ...MINIMAL_CONFIG.calendar, ...changes },
  });
}

/** Matches the INVALID_SETTINGS error whose message contains text. */
function invalidConfig(text: string) {
  return expect.objectContaining({
    code: "INVALID_SETTINGS",
    message: expect.stringContaining(text),
  });
}

describe("parseCalendarConfig", () => {
  it("accepts a minimal config", () => {
    expect(parseCalendarConfig(MINIMAL_CONFIG)).toEqual(MINIMAL_CONFIG);
  });

  it.each(["code", "name"])("rejects a calendar with no %s", (field) => {
    expect(() =>
      parseCalendarConfig(withCalendar({ [field]: undefined })),
    ).toThrow(invalidConfig(`calendar.${field}`));
  });

  it.each([
    // Settings are each state's code, not stored data (D36).
    ["a timezone", { timezone: "America/Denver" }, "calendar"],
    ["publicMonthsAhead", { publicMonthsAhead: 2 }, "calendar"],
    ["an extra key", { color: "blue" }, "calendar"],
  ])("rejects a calendar with %s", (_name, change, path) => {
    expect(() => parseCalendarConfig(withCalendar(change))).toThrow(
      invalidConfig(path),
    );
  });

  it("rejects a kind with a behaviour flag", () => {
    expect(() =>
      parseCalendarConfig(
        withChanges({ kinds: [HEARING, { ...FULL_BOARD, cancellable: true }] }),
      ),
    ).toThrow(invalidConfig("kinds.1"));
  });

  it("rejects duplicate resource codes", () => {
    expect(() =>
      parseCalendarConfig(
        withChanges({ resources: [FCF, { ...FCF, sortOrder: 2 }] }),
      ),
    ).toThrow(invalidConfig("resources.1.code"));
  });

  it("rejects a kind code with a colon", () => {
    expect(() =>
      parseCalendarConfig(
        withChanges({
          kinds: [HEARING, { ...FULL_BOARD, code: "FULL:BOARD" }],
        }),
      ),
    ).toThrow(invalidConfig("kinds.1.code"));
  });

  // zod still runs calendarConfigSchema's refinement after codeSchema rejects
  // a code, so these check that a bad code a pattern uses fails the parse
  // instead of throwing from entrySlotKey.
  it.each([
    [
      "kind",
      {
        kinds: [HEARING, { ...FULL_BOARD, code: "FULL:BOARD" }],
        patterns: [
          FCF_PATTERN,
          { ...FULL_BOARD_PATTERN, kindCode: "FULL:BOARD" },
        ],
      },
      ["kinds.1.code", "patterns.1.kindCode"],
    ],
    [
      "resource",
      {
        resources: [{ ...FCF, code: "F:CF" }],
        patterns: [
          { ...FCF_PATTERN, resourceCode: "F:CF" },
          FULL_BOARD_PATTERN,
        ],
      },
      ["resources.0.code", "patterns.0.resourceCode"],
    ],
  ])(
    "rejects a %s code with a colon that a pattern uses",
    (_name, changes, paths) => {
      const config = withChanges(changes);
      expect(calendarConfigSchema.safeParse(config).success).toBe(false);
      expect(() => parseCalendarConfig(config)).toThrow(
        expect.objectContaining({
          code: "INVALID_SETTINGS",
          message: expect.stringMatching(
            new RegExp(paths.map((path) => `(?=.*${path}:)`).join("")),
          ),
        }),
      );
    },
  );

  it("rejects duplicate kind codes", () => {
    expect(() =>
      parseCalendarConfig(
        withChanges({ kinds: [HEARING, FULL_BOARD, HEARING] }),
      ),
    ).toThrow(invalidConfig("kinds.2.code"));
  });

  it("rejects a resource with an unknown typeCode", () => {
    expect(() =>
      parseCalendarConfig(
        withChanges({ resources: [{ ...FCF, typeCode: "PRISON" }] }),
      ),
    ).toThrow(invalidConfig("resources.0.typeCode"));
  });

  it("rejects a pattern with an unknown kind", () => {
    expect(() =>
      parseCalendarConfig(
        withChanges({ patterns: [{ ...FCF_PATTERN, kindCode: "TRIAL" }] }),
      ),
    ).toThrow(invalidConfig("patterns.0.kindCode"));
  });

  it("rejects a pattern with an unknown resource", () => {
    expect(() =>
      parseCalendarConfig(
        withChanges({ patterns: [{ ...FCF_PATTERN, resourceCode: "CTCF" }] }),
      ),
    ).toThrow(invalidConfig("patterns.0.resourceCode"));
  });

  it("rejects two patterns with one slot key", () => {
    expect(() =>
      parseCalendarConfig(
        withChanges({
          patterns: [
            FCF_PATTERN,
            {
              ...FCF_PATTERN,
              rules: [{ type: "weekOfMonth", week: 3, weekday: "MONDAY" }],
            },
          ],
        }),
      ),
    ).toThrow(invalidConfig("slot key HEARING:FCF"));
  });

  it("rejects a pattern with invalid rules", () => {
    expect(() =>
      parseCalendarConfig(
        withChanges({ patterns: [{ ...FCF_PATTERN, rules: [] }] }),
      ),
    ).toThrow(invalidConfig("patterns.0.rules"));
  });

  it.each([
    ["an endTime with no startTime", { startTime: null, endTime: "09:00" }],
    [
      "an endTime before the startTime",
      { startTime: "10:00", endTime: "09:00" },
    ],
  ])("rejects %s", (_name, times) => {
    expect(() =>
      parseCalendarConfig(
        withChanges({ patterns: [{ ...FCF_PATTERN, ...times }] }),
      ),
    ).toThrow(invalidConfig("patterns.0.endTime"));
  });

  it("rejects a time that isn't HH:mm", () => {
    expect(() =>
      parseCalendarConfig(
        withChanges({ patterns: [{ ...FCF_PATTERN, startTime: "8:00" }] }),
      ),
    ).toThrow(invalidConfig("patterns.0.startTime"));
  });

  it("rejects an extra top-level key", () => {
    expect(() =>
      parseCalendarConfig({ ...MINIMAL_CONFIG, holidays: [] }),
    ).toThrow(invalidConfig("holidays"));
  });
});
