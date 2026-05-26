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

import {
  buildRecurrenceRule,
  describeRecurrence,
  getRecurrenceFreq,
  RecurrenceFreq,
} from "../recurrence";

// June 18, 2026 is a Thursday — picked as a stable anchor across the suite.
const ANCHOR = new Date(2026, 5, 18);

describe("buildRecurrenceRule", () => {
  test("NONE -> null regardless of anchor", () => {
    expect(buildRecurrenceRule("NONE", ANCHOR)).toBeNull();
    expect(buildRecurrenceRule("NONE", null)).toBeNull();
  });

  test("non-NONE without anchor -> null (nothing to persist yet)", () => {
    expect(buildRecurrenceRule("WEEKLY", null)).toBeNull();
    expect(buildRecurrenceRule("DAILY", null)).toBeNull();
  });

  test("DAILY emits FREQ=DAILY", () => {
    const rrule = buildRecurrenceRule("DAILY", ANCHOR);
    expect(rrule).toContain("FREQ=DAILY");
  });

  test("WEEKLY emits BYDAY for the anchor's weekday", () => {
    // Thursday
    expect(buildRecurrenceRule("WEEKLY", new Date(2026, 5, 18))).toContain(
      "BYDAY=TH",
    );
    // Friday
    expect(buildRecurrenceRule("WEEKLY", new Date(2026, 5, 19))).toContain(
      "BYDAY=FR",
    );
    // Sunday (JS getDay() == 0)
    expect(buildRecurrenceRule("WEEKLY", new Date(2026, 5, 21))).toContain(
      "BYDAY=SU",
    );
  });

  test("MONTHLY emits BYMONTHDAY for the anchor's date", () => {
    const rrule = buildRecurrenceRule("MONTHLY", ANCHOR);
    expect(rrule).toContain("FREQ=MONTHLY");
    expect(rrule).toContain("BYMONTHDAY=18");
  });

  test("YEARLY emits BYMONTH and BYMONTHDAY", () => {
    const rrule = buildRecurrenceRule("YEARLY", ANCHOR);
    expect(rrule).toContain("FREQ=YEARLY");
    expect(rrule).toContain("BYMONTH=6");
    expect(rrule).toContain("BYMONTHDAY=18");
  });
});

describe("getRecurrenceFreq", () => {
  test("null / empty string -> NONE", () => {
    expect(getRecurrenceFreq(null)).toBe("NONE");
    expect(getRecurrenceFreq("")).toBe("NONE");
  });

  test("malformed input -> NONE (does not throw)", () => {
    expect(getRecurrenceFreq("not an rrule")).toBe("NONE");
  });

  test("recovers the freq label from every supported variant", () => {
    const variants: ReadonlyArray<Exclude<RecurrenceFreq, "NONE">> = [
      "DAILY",
      "WEEKLY",
      "MONTHLY",
      "YEARLY",
    ];
    for (const freq of variants) {
      const rrule = buildRecurrenceRule(freq, ANCHOR);
      expect(getRecurrenceFreq(rrule)).toBe(freq);
    }
  });
});

describe("describeRecurrence", () => {
  test("null -> null", () => {
    expect(describeRecurrence(null)).toBeNull();
  });

  test("malformed input -> null", () => {
    expect(describeRecurrence("not an rrule")).toBeNull();
  });

  test("WEEKLY on a Friday includes the weekday name", () => {
    const rrule = buildRecurrenceRule("WEEKLY", new Date(2026, 5, 19));
    expect(describeRecurrence(rrule)).toMatch(/friday/i);
  });

  test("MONTHLY mentions the day-of-month", () => {
    const rrule = buildRecurrenceRule("MONTHLY", ANCHOR);
    expect(describeRecurrence(rrule)).toMatch(/18/);
  });

  test("DAILY produces a non-empty caption", () => {
    const rrule = buildRecurrenceRule("DAILY", ANCHOR);
    expect(describeRecurrence(rrule)).toMatch(/day/i);
  });
});
