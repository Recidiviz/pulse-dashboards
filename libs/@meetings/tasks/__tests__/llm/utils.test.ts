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

import {
  formatMeetingStartForPrompt,
  normalizeNameCasing,
} from "~@meetings/tasks/llm/utils";

describe("formatPersonName", () => {
  test("normalizes all-caps names", () => {
    expect(normalizeNameCasing("JEWEL HILPERT")).toBe("Jewel Hilpert");
  });

  test("keeps compound names intact", () => {
    expect(normalizeNameCasing("PATTIE SCHILLER-GRAHAM")).toBe(
      "Pattie Schiller-Graham",
    );
    expect(normalizeNameCasing("SEAN O'BRIEN")).toBe("Sean O'Brien");
    expect(normalizeNameCasing("D'ANGELO VANDERVORT")).toBe(
      "D'Angelo Vandervort",
    );
  });

  test("normalizes accented names", () => {
    expect(normalizeNameCasing("JOSÉ GONÇALVES")).toBe("José Gonçalves");
  });

  test("leaves words that already have lowercase letters alone", () => {
    expect(normalizeNameCasing("Jane McDonald")).toBe("Jane McDonald");
    expect(normalizeNameCasing("Ana de la Cruz")).toBe("Ana de la Cruz");
    expect(normalizeNameCasing("MARIA de la Cruz")).toBe("Maria de la Cruz");
  });

  test("handles names with initials and empty input", () => {
    expect(normalizeNameCasing("J.R. SMITH")).toBe("J.R. Smith");
    expect(normalizeNameCasing("")).toBe("");
  });
});

describe("formatMeetingStartForPrompt", () => {
  test("spells out the weekday, date, and local time with its zone", () => {
    const startTime = new Date("2026-09-24T15:00:00Z");
    expect(formatMeetingStartForPrompt(startTime, "US_NE")).toBe(
      "Thursday, September 24, 2026 at 10:00 AM CDT",
    );
  });

  test("uses the state's local day for an evening meeting that is the next day in UTC", () => {
    // 7:30pm Central on Sep 24 is 00:30 UTC on Sep 25.
    const startTime = new Date("2026-09-25T00:30:00Z");
    expect(formatMeetingStartForPrompt(startTime, "US_NE")).toBe(
      "Thursday, September 24, 2026 at 7:30 PM CDT",
    );
  });

  test("respects each state's own zone", () => {
    // 11pm Mountain on Mar 3 is 1am Eastern on Mar 4.
    const startTime = new Date("2026-03-04T06:00:00Z");
    expect(formatMeetingStartForPrompt(startTime, "US_UT")).toBe(
      "Tuesday, March 3, 2026 at 11:00 PM MST",
    );
    expect(formatMeetingStartForPrompt(startTime, "US_ME")).toBe(
      "Wednesday, March 4, 2026 at 1:00 AM EST",
    );
  });
});
