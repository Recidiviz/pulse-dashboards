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

import { UsTnMonthlyReports } from "../UsTnSingleResidentDataContext/context";
import { UsTnAllMonthCreditReportPresenter } from "./UsTnAllMonthCreditReportPresenter";

const monthlyReports = {
  "august-2023": {
    formattedMonth: "August 2023",
    monthSlug: "august-2023",
    date: new Date("2023-08-01"),
  },
  "july-2023": {
    formattedMonth: "July 2023",
    monthSlug: "july-2023",
    date: new Date("2023-07-01"),
  },
  "june-2023": {
    formattedMonth: "June 2023",
    monthSlug: "june-2023",
    date: new Date("2023-06-01"),
  },
  "march-2024": {
    formattedMonth: "March 2024",
    monthSlug: "march-2024",
    date: new Date("2024-03-01"),
  },
  "april-2024": {
    formattedMonth: "April 2024",
    monthSlug: "april-2024",
    date: new Date("2024-04-01"),
  },
  "may-2024": {
    formattedMonth: "May 2024",
    monthSlug: "may-2024",
    date: new Date("2024-05-01"),
  },
} as never as UsTnMonthlyReports;

describe("UsTnAllMonthCreditReportPresenter tests", () => {
  it("groups reports by year and orders them by date within each year", () => {
    const presenter = new UsTnAllMonthCreditReportPresenter(
      {} as never as ResidentRecord,
      monthlyReports,
    );

    expect(Object.keys(presenter.groupedReportsByYear).sort()).toEqual([
      "2023",
      "2024",
    ]);

    expect(
      presenter.groupedReportsByYear["2023"].map((r) => r.formattedMonth),
    ).toEqual(["August 2023", "July 2023", "June 2023"]);

    expect(
      presenter.groupedReportsByYear["2024"].map((r) => r.formattedMonth),
    ).toEqual(["May 2024", "April 2024", "March 2024"]);
  });

  it("orders years in descending order", () => {
    const presenter = new UsTnAllMonthCreditReportPresenter(
      {} as never as ResidentRecord,
      monthlyReports,
    );

    expect(presenter.orderedYears).toEqual(["2024", "2023"]);
  });
});
