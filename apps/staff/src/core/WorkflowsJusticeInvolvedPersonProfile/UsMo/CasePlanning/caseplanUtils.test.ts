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

import { describe, expect, test } from "vitest";

import { getObjectiveDueStatus } from "./caseplanUtils";

// Local Date construction (year, monthIndex, day) to avoid the UTC-midnight
// drift that `new Date("2026-06-23")` would introduce. June is monthIndex 5.
const NOW = new Date(2026, 5, 23);

describe("getObjectiveDueStatus", () => {
  test("returns 'overdue' for a date before the start of now's day", () => {
    expect(getObjectiveDueStatus(new Date(2026, 5, 22), NOW)).toBe("overdue");
  });

  test("returns 'overdue' for a far-past date", () => {
    expect(getObjectiveDueStatus(new Date(2025, 0, 1), NOW)).toBe("overdue");
  });

  test("treats a time earlier the same calendar day as overdue", () => {
    // `now` is midnight-local (2026-06-23 00:00); an end date at 2026-06-22
    // 23:59 is before the start of today, so it is overdue.
    expect(getObjectiveDueStatus(new Date(2026, 5, 22, 23, 59), NOW)).toBe(
      "overdue",
    );
  });

  test("returns 'dueSoon' when due today", () => {
    expect(getObjectiveDueStatus(new Date(2026, 5, 23), NOW)).toBe("dueSoon");
  });

  test("returns 'dueSoon' when due tomorrow", () => {
    expect(getObjectiveDueStatus(new Date(2026, 5, 24), NOW)).toBe("dueSoon");
  });

  test("returns 'dueSoon' when due exactly 7 calendar days out", () => {
    expect(getObjectiveDueStatus(new Date(2026, 5, 30), NOW)).toBe("dueSoon");
  });

  test("returns null when due 8 calendar days out", () => {
    expect(getObjectiveDueStatus(new Date(2026, 6, 1), NOW)).toBeNull();
  });

  test("returns null for a far-future date", () => {
    expect(getObjectiveDueStatus(new Date(2027, 0, 1), NOW)).toBeNull();
  });

  test("returns null for null", () => {
    expect(getObjectiveDueStatus(null, NOW)).toBeNull();
  });

  test("returns null for undefined", () => {
    expect(getObjectiveDueStatus(undefined, NOW)).toBeNull();
  });

  test("defaults `now` to the current time when omitted", () => {
    // A clearly-past date is always overdue regardless of the real clock.
    expect(getObjectiveDueStatus(new Date(2000, 0, 1))).toBe("overdue");
  });
});
