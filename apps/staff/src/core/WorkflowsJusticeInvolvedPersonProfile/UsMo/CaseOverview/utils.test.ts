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

import { parseISO } from "date-fns";
import tk from "timekeeper";
import { afterEach, beforeEach, describe, expect, test } from "vitest";

import {
  buildAddressLines,
  calculateAge,
  formatDob,
  formatSentence,
} from "./utils";

describe("calculateAge", () => {
  afterEach(() => {
    tk.reset();
  });

  test("returns whole years between birthdate and today", () => {
    tk.freeze(new Date(2026, 4, 28)); // 2026-05-28
    expect(calculateAge(parseISO("1988-03-14"))).toBe(38);
  });

  test("returns one less year when the birthday has not yet occurred this year", () => {
    tk.freeze(new Date(2026, 4, 28)); // May 28, 2026
    // Birthday in November of the same birth year — 11 calendar months ahead.
    expect(calculateAge(parseISO("1988-11-30"))).toBe(37);
  });

  test("returns the full year on the birthday itself", () => {
    tk.freeze(new Date(2026, 4, 28)); // May 28, 2026
    expect(calculateAge(parseISO("1988-05-28"))).toBe(38);
  });

  test("returns one less year on the day before the birthday", () => {
    tk.freeze(new Date(2026, 4, 27)); // May 27, 2026
    expect(calculateAge(parseISO("1988-05-28"))).toBe(37);
  });

  test("handles a leap-day birthdate in a non-leap year", () => {
    tk.freeze(new Date(2025, 2, 1)); // Mar 1, 2025
    // Born Feb 29, 2000. They are 25 today (Mar 1) but not on Feb 28.
    expect(calculateAge(parseISO("2000-02-29"))).toBe(25);
  });

  test("handles a leap-day birthdate the day before March 1 in a non-leap year", () => {
    tk.freeze(new Date(2025, 1, 28)); // Feb 28, 2025
    expect(calculateAge(parseISO("2000-02-29"))).toBe(24);
  });

  test("handles a December 31 birthdate at year boundary", () => {
    tk.freeze(new Date(2026, 11, 31)); // Dec 31, 2026
    expect(calculateAge(parseISO("1990-12-31"))).toBe(36);
  });

  test("returns 0 for a newborn", () => {
    tk.freeze(new Date(2026, 4, 28));
    expect(calculateAge(parseISO("2026-05-28"))).toBe(0);
  });
});

describe("formatDob", () => {
  beforeEach(() => {
    tk.freeze(new Date(2026, 4, 28)); // 2026-05-28 for deterministic age calc
  });

  afterEach(() => {
    tk.reset();
  });

  test("formats the birthdate as MM/dd/yyyy with the current age", () => {
    expect(formatDob(parseISO("1988-03-14"))).toBe("03/14/1988 (38 years old)");
  });

  test("renders 0 years on the day of birth", () => {
    expect(formatDob(parseISO("2026-05-28"))).toBe("05/28/2026 (0 years old)");
  });
});

describe("formatSentence", () => {
  test("includes the classificationType when present", () => {
    expect(
      formatSentence({
        classificationSubtype: "D",
        classificationType: "Felony",
        description: "Possession of Controlled Substance",
        statute: "579.015",
      }),
    ).toBe(
      "Possession of Controlled Substance (Class D Felony) - RSMo 579.015",
    );
  });

  test("omits the classificationType when it is empty", () => {
    expect(
      formatSentence({
        classificationSubtype: "C",
        classificationType: "",
        description: "Unlawful Possession of a Firearm",
        statute: "571.070",
      }),
    ).toBe("Unlawful Possession of a Firearm (Class C) - RSMo 571.070");
  });

  test("renders '(Statute unknown)' in place of the RSMo segment when statute is null", () => {
    expect(
      formatSentence({
        classificationSubtype: "D",
        classificationType: "Felony",
        description: "Out-of-State Offense",
        statute: null,
      }),
    ).toBe("Out-of-State Offense (Class D Felony) (Statute unknown)");
  });
});

describe("buildAddressLines", () => {
  test("returns empty array when address is undefined", () => {
    expect(buildAddressLines()).toEqual([]);
  });

  test("returns empty array when no fields are populated", () => {
    expect(buildAddressLines({})).toEqual([]);
  });

  test("combines city/state/zip into one line", () => {
    expect(
      buildAddressLines({
        addressLine1: "100 Main St.",
        addressCity: "St. Louis",
        addressState: "MO",
        addressZip: "63104",
      }),
    ).toEqual(["100 Main St.", "St. Louis, MO 63104"]);
  });

  test("includes addressLine2 between line1 and city/state/zip", () => {
    expect(
      buildAddressLines({
        addressLine1: "100 Main St.",
        addressLine2: "Apt 4B",
        addressCity: "St. Louis",
        addressState: "MO",
        addressZip: "63104",
      }),
    ).toEqual(["100 Main St.", "Apt 4B", "St. Louis, MO 63104"]);
  });

  test("omits city/state/zip line entirely when all three are missing", () => {
    expect(buildAddressLines({ addressLine1: "100 Main St." })).toEqual([
      "100 Main St.",
    ]);
  });
});
