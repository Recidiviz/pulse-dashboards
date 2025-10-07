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

import { ResidentRecord } from "~datatypes";

import { UsTnMonthlyReports } from "../../UsTnSingleResidentDataContext/context";
import { UsTnMonthlyReportsPresenter } from "./UsTnMonthlyReportsPresenter";

describe("UsTnMonthlyReportsPresenter tests", () => {
  const resident = { stateCode: "US_TN" } as never as ResidentRecord;

  const partialMonthlyReports = {
    "november-2023": { date: new Date("2023-11-01") },
    "december-2023": { date: new Date("2023-12-01") },
    "january-2024": { date: new Date("2023-12-01") },
    "february-2024": { date: new Date("2024-02-01") },
  } as never as UsTnMonthlyReports;

  const monthlyReports = {
    ...partialMonthlyReports,
    "march-2024": { date: new Date("2024-03-01") },
    "april-2024": { date: new Date("2024-04-01") },
    "may-2024": { date: new Date("2024-05-01") },
    "june-2024": { date: new Date("2024-06-01") },
    "july-2024": { date: new Date("2024-07-01") },
    "august-2024": { date: new Date("2024-08-01") },
    "september-2024": { date: new Date("2024-09-01") },
    "october-2024": { date: new Date("2024-10-01") },
    "november-2024": { date: new Date("2024-11-01") },
    "december-2024": { date: new Date("2024-12-01") },
  } as never as UsTnMonthlyReports;

  describe("mostRecentReports", () => {
    it("returns the 8 most recent months when there are more than 8 months", () => {
      const presenter = new UsTnMonthlyReportsPresenter(
        resident,
        monthlyReports,
      );
      const mostRecent = presenter.mostRecentReports;
      expect(mostRecent.length).toBe(8);
      expect(mostRecent[0].date).toEqual(new Date("2024-12-01"));
      expect(mostRecent[7].date).toEqual(new Date("2024-05-01"));
    });

    it("returns all months when there are 8 or fewer months", () => {
      const presenter = new UsTnMonthlyReportsPresenter(
        resident,
        partialMonthlyReports,
      );
      const mostRecent = presenter.mostRecentReports;
      expect(mostRecent.length).toBe(4);
      expect(mostRecent[0].date).toEqual(new Date("2024-02-01"));
      expect(mostRecent[3].date).toEqual(new Date("2023-11-01"));
    });
  });
});
