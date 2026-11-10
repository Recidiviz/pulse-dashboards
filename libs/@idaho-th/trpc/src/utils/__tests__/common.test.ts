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

import { formatIsoDate, parseDateString } from "../common";

describe("formatIsoDate", () => {
  it("converts YYYY-MM-DD into M/D/YYYY without leading zeros", () => {
    expect(formatIsoDate("2026-04-23")).toBe("4/23/2026");
    expect(formatIsoDate("2026-12-01")).toBe("12/1/2026");
  });

  it("returns the original string when the value is not an ISO date", () => {
    expect(formatIsoDate("not-a-date")).toBe("not-a-date");
    expect(formatIsoDate("2026-4-23")).toBe("2026-4-23");
  });

  // No month/day range validation — any two-digit values that match the regex
  // are formatted as-is.
  it("formats out-of-range month/day values without validation", () => {
    expect(formatIsoDate("2026-13-45")).toBe("13/45/2026");
  });
});

describe("parseDateString", () => {
  it("parses an ISO date string as a UTC date", () => {
    expect(parseDateString("2026-04-23")).toEqual(
      new Date(Date.UTC(2026, 3, 23)),
    );
  });

  it("parses the date prefix of a full ISO timestamp", () => {
    expect(parseDateString("2026-04-23T10:00:00.000Z")).toEqual(
      new Date(Date.UTC(2026, 3, 23)),
    );
  });

  it("parses a US-format date string as a UTC date", () => {
    expect(parseDateString("4/23/2026")).toEqual(
      new Date(Date.UTC(2026, 3, 23)),
    );
  });

  it("returns null for an unrecognized format", () => {
    expect(parseDateString("not-a-date")).toBeNull();
    expect(parseDateString("2026-4-23")).toBeNull();
  });

  it("returns null for an ISO date prefix followed by unexpected trailing content", () => {
    expect(parseDateString("2026-04-23garbage")).toBeNull();
  });

  it("returns null for out-of-range month/day values", () => {
    expect(parseDateString("2026-13-45")).toBeNull();
    expect(parseDateString("2026-02-30")).toBeNull();
    expect(parseDateString("13/45/2026")).toBeNull();
  });

  it("returns null for a day that passes pre-filtering but does not exist on the calendar", () => {
    expect(parseDateString("2026-04-31")).toBeNull();
  });

  it("returns null for null/undefined/empty values", () => {
    expect(parseDateString(null)).toBeNull();
    expect(parseDateString(undefined)).toBeNull();
    expect(parseDateString("")).toBeNull();
  });
});
