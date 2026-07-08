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

import { UsCoResidentJiiData, WorkflowsResidentRecord } from "~datatypes";

import { UsCoCreditReportPresenter } from "./UsCoCreditReportPresenter";

const resident = {} as never as WorkflowsResidentRecord;

const buildMetadata = (
  creditActivity: {
    creditDate: Date;
    creditType: string | null;
    creditsEarned: number | null;
  }[],
): UsCoResidentJiiData =>
  ({ stateCode: "US_CO", creditActivity }) as never as UsCoResidentJiiData;

// one EARNED_TIME credit per month for the given month-start dates
const metadataForMonths = (dates: Date[]): UsCoResidentJiiData =>
  buildMetadata(
    dates.map((creditDate) => ({
      creditDate,
      creditType: "EARNED_TIME",
      creditsEarned: 10,
    })),
  );

describe("UsCoCreditReportPresenter tests", () => {
  describe("monthly report processing", () => {
    const mockCreditActivity = [
      {
        creditDate: new Date("2024-12-31"),
        creditType: "EARNED_TIME" as const,
        creditsEarned: 10,
      },
      {
        creditDate: new Date("2024-12-31"),
        creditType: "ACHIEVEMENT" as const,
        creditsEarned: 5,
      },
      {
        creditDate: new Date("2024-11-30"),
        creditType: "GOOD_TIME" as const,
        creditsEarned: 8,
      },
      {
        creditDate: new Date("2024-11-30"),
        creditType: "OTHER" as const,
        creditsEarned: 2,
      },
      {
        creditDate: new Date("2024-10-31"),
        creditType: "PROJECTED_EARNED_TIME_FINAL_3_MONTHS" as const,
        creditsEarned: 10,
      },
      {
        creditDate: new Date("2024-10-31"),
        creditType: null,
        creditsEarned: 1,
      },
    ];

    it("aggregates monthly reports keyed by month, bucketing credits by type", () => {
      const presenter = new UsCoCreditReportPresenter(
        resident,
        buildMetadata(mockCreditActivity),
      );

      expect(presenter.orderedYears).toEqual(["2024"]);
      expect(
        presenter.groupedReportsByYear["2024"].map((r) => r.monthSlug),
      ).toEqual(["2024-12", "2024-11", "2024-10"]);

      const december = presenter.groupedReportsByYear["2024"][0];
      expect(december).toEqual({
        monthSlug: "2024-12",
        date: new Date("2024-12-31"),
        totalCredits: 15,
        activities: mockCreditActivity.slice(0, 2),
        creditEntries: [
          ["EARNED_TIME", 10],
          ["ACHIEVEMENT", 5],
        ],
      });

      const november = presenter.groupedReportsByYear["2024"][1];
      expect(november).toEqual({
        monthSlug: "2024-11",
        date: new Date("2024-11-30"),
        totalCredits: 10,
        activities: mockCreditActivity.slice(2, 4),
        creditEntries: [
          ["GOOD_TIME", 8],
          ["OTHER", 2],
        ],
      });

      const october = presenter.groupedReportsByYear["2024"][2];
      expect(october).toEqual({
        monthSlug: "2024-10",
        date: new Date("2024-10-31"),
        totalCredits: 11,
        activities: mockCreditActivity.slice(4, 6),
        creditEntries: [
          ["PROJECTED_EARNED_TIME_FINAL_3_MONTHS", 10],
          ["OTHER", 1],
        ],
      });
    });

    it("returns no reports when there is no credit activity", () => {
      const presenter = new UsCoCreditReportPresenter(
        resident,
        buildMetadata([]),
      );
      expect(presenter.orderedYears).toEqual([]);
      expect(presenter.mostRecentReports).toEqual([]);
    });
  });

  describe("groupedReportsByYear / orderedYears", () => {
    // one EARNED_TIME credit per month, spanning two years
    const monthDates = [
      new Date("2023-06-15"),
      new Date("2023-07-15"),
      new Date("2023-08-15"),
      new Date("2024-03-15"),
      new Date("2024-04-15"),
      new Date("2024-05-15"),
    ];

    it("groups reports by year and orders them by date within each year", () => {
      const presenter = new UsCoCreditReportPresenter(
        resident,
        metadataForMonths(monthDates),
      );

      expect(Object.keys(presenter.groupedReportsByYear).sort()).toEqual([
        "2023",
        "2024",
      ]);

      expect(
        presenter.groupedReportsByYear["2023"].map((r) => r.monthSlug),
      ).toEqual(["2023-08", "2023-07", "2023-06"]);

      expect(
        presenter.groupedReportsByYear["2024"].map((r) => r.monthSlug),
      ).toEqual(["2024-05", "2024-04", "2024-03"]);
    });

    it("orders years in descending order", () => {
      const presenter = new UsCoCreditReportPresenter(
        resident,
        metadataForMonths(monthDates),
      );

      expect(presenter.orderedYears).toEqual(["2024", "2023"]);
    });
  });

  describe("mostRecentReports", () => {
    const partialMonths = [
      new Date("2023-11-01"),
      new Date("2023-12-01"),
      new Date("2024-01-01"),
      new Date("2024-02-01"),
    ];

    const manyMonths = [
      ...partialMonths,
      new Date("2024-03-01"),
      new Date("2024-04-01"),
      new Date("2024-05-01"),
      new Date("2024-06-01"),
      new Date("2024-07-01"),
      new Date("2024-08-01"),
      new Date("2024-09-01"),
      new Date("2024-10-01"),
      new Date("2024-11-01"),
      new Date("2024-12-01"),
    ];

    it("returns the 8 most recent months when there are more than 8 months", () => {
      const presenter = new UsCoCreditReportPresenter(
        resident,
        metadataForMonths(manyMonths),
      );
      const mostRecent = presenter.mostRecentReports;
      expect(mostRecent.length).toBe(8);
      expect(mostRecent[0].date).toEqual(new Date("2024-12-01"));
      expect(mostRecent[7].date).toEqual(new Date("2024-05-01"));
    });

    it("returns all months when there are 8 or fewer months", () => {
      const presenter = new UsCoCreditReportPresenter(
        resident,
        metadataForMonths(partialMonths),
      );
      const mostRecent = presenter.mostRecentReports;
      expect(mostRecent.length).toBe(4);
      expect(mostRecent[0].date).toEqual(new Date("2024-02-01"));
      expect(mostRecent[3].date).toEqual(new Date("2023-11-01"));
    });
  });
});
