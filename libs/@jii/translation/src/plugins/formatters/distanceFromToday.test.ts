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

import { addMonths } from "date-fns";

import { testTranslation } from "../../utils/testTranslation";

describe("formatDistanceFromTodayFormatter", () => {
  it("should format distance in English", async () => {
    const futureDate = addMonths(new Date(), 2);

    const result = await testTranslation(
      "{{testDate, formatDistanceFromToday}}",
      {
        testDate: futureDate,
      },
    );

    expect(result).toBe("2 months");
  });

  it("should handle fallback text for null dates", async () => {
    const result = await testTranslation(
      "{{testDate, formatDistanceFromToday(fallbackText: 'No date provided')}}",
      {
        testDate: null,
      },
    );

    expect(result).toBe("No date provided");
  });

  it("should format distance in Spanish with Spanish locale", async () => {
    const futureDate = addMonths(new Date(), 2);

    const result = await testTranslation(
      "{{testDate, formatDistanceFromToday}}",
      {
        testDate: futureDate,
      },
      "es", // Spanish locale
    );

    // Should use Spanish month names from date-fns Spanish locale
    expect(result).toBe("2 meses");
  });
});
