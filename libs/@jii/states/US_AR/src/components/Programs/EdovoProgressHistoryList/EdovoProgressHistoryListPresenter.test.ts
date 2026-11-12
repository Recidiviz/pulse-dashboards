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

import { usArResidentJiiDataFixtures } from "~@jii/fixtures";
import { usArStateDataSchema } from "~@jii/schemas";

import { EdovoProgressHistoryListPresenter } from "./EdovoProgressHistoryListPresenter";

function month(completionMonth: string) {
  return {
    completionMonth,
    eligibleHours: 4,
    carryInHours: 0,
    totalHours: 4,
    is16HoursReached: false,
  };
}

function createPresenter(completionMonths: string[]) {
  const metadata = usArStateDataSchema.parse({
    ...usArResidentJiiDataFixtures[0],
    creditActivity: completionMonths.map(month),
  });
  return new EdovoProgressHistoryListPresenter(metadata);
}

describe("EdovoProgressHistoryListPresenter tests", () => {
  const partialMonths = ["2021-10-01", "2021-12-01", "2021-11-01"];
  const months = [...partialMonths, "2021-08-01", "2021-09-01"];

  describe("recentMonths", () => {
    it("returns the 3 most recent months sorted newest first, when there are more than 3 months", () => {
      const recent = createPresenter(months).recentMonths;
      expect(recent.map((m) => m.completionMonth)).toEqual([
        parseISO("2021-12-01"),
        parseISO("2021-11-01"),
        parseISO("2021-10-01"),
      ]);
    });

    it("returns all months, sorted newest first, when there are 3 or fewer months", () => {
      const recent = createPresenter(partialMonths.slice(0, 2)).recentMonths;
      expect(recent.map((m) => m.completionMonth)).toEqual([
        parseISO("2021-12-01"),
        parseISO("2021-10-01"),
      ]);
    });
  });
});
