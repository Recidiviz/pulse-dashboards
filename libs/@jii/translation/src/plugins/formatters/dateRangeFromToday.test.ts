// Recidiviz - a data platform for criminal justice reform
// Copyright (C) 2025 Recidiviz, Inc.
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

import timekeeper from "timekeeper";

import { testTranslation } from "../../utils/testTranslation";

describe("formatDateRangeFromTodayFormatter", () => {
  beforeEach(() => {
    timekeeper.freeze(new Date("2025-10-30"));
  });

  afterEach(() => {
    timekeeper.reset();
  });

  it("should format short date range (< 12 months) in months and days", async () => {
    const pastDate = new Date("2025-08-15");

    const result = await testTranslation("{{date, formatDateRangeFromToday}}", {
      date: pastDate,
    });

    expect(result).toBe("2 months, 15 days");
  });

  it("should format dates more than a year away in years and months", async () => {
    const futureDate = new Date("2027-04-30");

    const result = await testTranslation("{{date, formatDateRangeFromToday}}", {
      date: futureDate,
    });

    expect(result).toBe("1 year, 6 months");
  });

  it("should handle fallback text for null dates", async () => {
    const result = await testTranslation(
      "{{date, formatDateRangeFromToday(fallbackText: 'No date provided')}}",
      {
        date: undefined,
      },
    );

    expect(result).toBe("No date provided");
  });

  it("should format date range in Spanish with Spanish locale", async () => {
    const pastDate = new Date("2025-07-30");

    const result = await testTranslation(
      "{{date, formatDateRangeFromToday}}",
      {
        date: pastDate,
      },
      "es", // Spanish locale
    );

    expect(result).toBe("3 meses");
  });

  it("should allow custom delimiter", async () => {
    const futureDate = new Date("2030-07-30");

    const result = await testTranslation(
      "{{date, formatDateRangeFromToday(delimiter: ' and ')}}",
      {
        date: futureDate,
      },
    );

    expect(result).toBe("4 years and 9 months");
  });
});
