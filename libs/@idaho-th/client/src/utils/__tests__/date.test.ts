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

// A negative-UTC timezone is where the bug reproduced: a UTC-midnight instant
// read with local getters lands on the previous day. The suite is pinned to
// America/New_York via `test.env.TZ` in vite.config.mts (Node reads TZ at startup).
import {
  formatCalendarDate,
  formatResponseTimestamp,
  formatTimestamp,
  toCalendarDate,
} from "../date";

describe("calendar date helpers (America/New_York)", () => {
  it("formats a UTC-midnight Date as the intended day, not the day before", () => {
    expect(formatCalendarDate(new Date("2026-07-30T00:00:00.000Z"))).toBe(
      "July 30, 2026",
    );
  });

  it("formats a UTC-midnight ISO string as the intended day", () => {
    expect(formatCalendarDate("2026-07-30T00:00:00.000Z")).toBe(
      "July 30, 2026",
    );
  });

  it("formats a MM/dd/yyyy string without shifting", () => {
    expect(formatCalendarDate("07/30/2026")).toBe("July 30, 2026");
  });

  it("respects a custom pattern", () => {
    expect(
      formatCalendarDate(new Date("2026-07-30T00:00:00.000Z"), "MM/dd/yyyy"),
    ).toBe("07/30/2026");
  });

  it("returns empty string for nullish and invalid values", () => {
    expect(formatCalendarDate(null)).toBe("");
    expect(formatCalendarDate(undefined)).toBe("");
    expect(formatCalendarDate("not a date")).toBe("");
  });

  it("toCalendarDate re-anchors UTC day to local midnight", () => {
    const result = toCalendarDate(new Date("2026-07-30T00:00:00.000Z"));
    expect(result).not.toBeNull();
    expect(result?.getFullYear()).toBe(2026);
    expect(result?.getMonth()).toBe(6); // July, zero-indexed
    expect(result?.getDate()).toBe(30);
    expect(result?.getHours()).toBe(0);
  });

  it("toCalendarDate returns null for invalid input", () => {
    expect(toCalendarDate("not a date")).toBeNull();
  });

  it("formatTimestamp reads local components (unlike the calendar helper)", () => {
    // A 3am-UTC instant is still the 29th in New York (UTC-4): a timestamp keeps
    // its moment-in-time meaning and is not re-anchored to a calendar day.
    expect(formatTimestamp(new Date("2026-07-30T03:00:00.000Z"))).toBe(
      "July 29, 2026",
    );
  });

  it("formatTimestamp returns empty string for nullish and invalid values", () => {
    expect(formatTimestamp(null)).toBe("");
    expect(formatTimestamp(undefined)).toBe("");
    expect(formatTimestamp("not a date")).toBe("");
  });

  it("formatResponseTimestamp shows the viewer's local time zone abbreviation", () => {
    // 2026-04-23T20:05:00Z is 16:05 Eastern Daylight Time.
    expect(formatResponseTimestamp(new Date("2026-04-23T20:05:00Z"))).toBe(
      "Apr 23, 2026, 16:05 EDT",
    );
  });

  it("formatResponseTimestamp shows the standard-time abbreviation outside DST", () => {
    // 2026-01-23T21:05:00Z is 16:05 Eastern Standard Time.
    expect(formatResponseTimestamp(new Date("2026-01-23T21:05:00Z"))).toBe(
      "Jan 23, 2026, 16:05 EST",
    );
  });
});
