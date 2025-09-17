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

import {
  processMonthlyReports,
  UsTnMonthlyReportsPresenter,
} from "./UsTnMonthlyReportsPresenter";

describe("UsTnMonthlyReportsPresenter tests", () => {
  const mockCreditActivity = [
    {
      creditDate: new Date("2024-12-31"),
      creditType: "BEHAVIOR" as const,
      creditsEarned: 5,
    },
    {
      creditDate: new Date("2024-12-31"),
      creditType: "PROGRAM" as const,
      creditsEarned: 10,
    },
    {
      creditDate: new Date("2024-11-30"),
      creditType: "GED" as const,
      creditsEarned: 15,
    },
    {
      creditDate: new Date("2024-11-30"),
      creditType: "60_DAY_TREATMENT" as const,
      creditsEarned: 8,
    },
    {
      creditDate: new Date("2024-10-31"),
      creditType: "BONUS_BEHAVIOR" as const,
      creditsEarned: 3,
    },
    {
      creditDate: new Date("2024-10-31"),
      creditType: "REMOVAL" as const,
      creditsEarned: -15,
    },
  ];

  const createMockResident = (
    stateCode: string,
    creditActivity: {
      creditDate: Date;
      creditType: string;
      creditsEarned: number | null;
    }[] = [],
  ): ResidentRecord =>
    ({
      metadata: {
        stateCode,
        creditActivity,
      },
    }) as never as ResidentRecord;

  describe("constructor", () => {
    it("should initialize with the first monthly report option selected", () => {
      const resident = createMockResident("US_TN", mockCreditActivity);
      const presenter = new UsTnMonthlyReportsPresenter(resident);

      expect(presenter.selectedSearchOption).toEqual({
        value: "December 2024",
        label: "December 2024",
      });
    });
  });

  describe("processMonthlyReports", () => {
    const processedReports = processMonthlyReports(
      createMockResident("US_TN", mockCreditActivity),
    );

    it("should aggregate monthly reports into an object keyed by month of report", () => {
      expect(Object.keys(processedReports)).toHaveLength(3);

      expect(processedReports["December 2024"]).toEqual({
        formattedMonth: "December 2024",
        month: new Date("2024-12-31"),
        behaviorCredits: 5,
        programCredits: 10,
        educationCredits: 0,
        treatmentCredits: 0,
        creditRemovals: 0,
        totalCredits: 15,
        reports: mockCreditActivity.slice(0, 2),
      });

      expect(processedReports["November 2024"]).toEqual({
        formattedMonth: "November 2024",
        month: new Date("2024-11-30"),
        behaviorCredits: 0,
        programCredits: 0,
        educationCredits: 15,
        treatmentCredits: 8,
        creditRemovals: 0,
        totalCredits: 23,
        reports: mockCreditActivity.slice(2, 4),
      });

      expect(processedReports["October 2024"]).toEqual({
        formattedMonth: "October 2024",
        month: new Date("2024-10-31"),
        behaviorCredits: 3,
        programCredits: 0,
        educationCredits: 0,
        treatmentCredits: 0,
        creditRemovals: -15,
        totalCredits: -12,
        reports: mockCreditActivity.slice(4, 6),
      });
    });
  });

  describe("monthlyReportOptions", () => {
    it("should return sorted monthly report options in descending order", () => {
      const resident = createMockResident("US_TN", mockCreditActivity);
      const presenter = new UsTnMonthlyReportsPresenter(resident);

      expect(presenter.monthlyReportOptions).toEqual([
        { value: "December 2024", label: "December 2024" },
        { value: "November 2024", label: "November 2024" },
        { value: "October 2024", label: "October 2024" },
      ]);
    });

    it("should handle multiple credits in the same month", () => {
      const duplicateMonthActivity = [
        {
          creditDate: new Date("2024-12-31"),
          creditType: "BEHAVIOR" as const,
          creditsEarned: 5,
        },
        {
          creditDate: new Date("2024-12-31"),
          creditType: "PROGRAM" as const,
          creditsEarned: 10,
        },
      ];
      const resident = createMockResident("US_TN", duplicateMonthActivity);
      const presenter = new UsTnMonthlyReportsPresenter(resident);

      expect(presenter.monthlyReportOptions).toEqual([
        { value: "December 2024", label: "December 2024" },
      ]);
    });
  });

  describe("selectedMonthlyReport", () => {
    it("should return the correct monthly report for the selected option", () => {
      const resident = createMockResident("US_TN", mockCreditActivity);
      const presenter = new UsTnMonthlyReportsPresenter(resident);

      const selectedReport = presenter.selectedMonthlyReport;
      expect(selectedReport.formattedMonth).toBe("December 2024");
      expect(selectedReport.behaviorCredits).toBe(5);
      expect(selectedReport.programCredits).toBe(10);
      expect(selectedReport.educationCredits).toBe(0);
      expect(selectedReport.treatmentCredits).toBe(0);
      expect(selectedReport.reports).toEqual(mockCreditActivity.slice(0, 2));
    });

    it("should aggregate credits correctly by type", () => {
      const multipleCreditsActivity = [
        {
          creditDate: new Date("2024-12-15"),
          creditType: "BEHAVIOR" as const,
          creditsEarned: 5,
        },
        {
          creditDate: new Date("2024-12-20"),
          creditType: "BONUS_BEHAVIOR" as const,
          creditsEarned: 3,
        },
        {
          creditDate: new Date("2024-12-10"),
          creditType: "PROGRAM" as const,
          creditsEarned: 7,
        },
        {
          creditDate: new Date("2024-12-25"),
          creditType: "BONUS_PROGRAM" as const,
          creditsEarned: 2,
        },
        {
          creditDate: new Date("2024-12-05"),
          creditType: "60_DAY_ED_CREDIT" as const,
          creditsEarned: 12,
        },
        {
          creditDate: new Date("2024-12-12"),
          creditType: "GED" as const,
          creditsEarned: 8,
        },
        {
          creditDate: new Date("2024-12-18"),
          creditType: "60_DAY_TREATMENT" as const,
          creditsEarned: 6,
        },
      ];
      const resident = createMockResident("US_TN", multipleCreditsActivity);
      const presenter = new UsTnMonthlyReportsPresenter(resident);

      const selectedReport = presenter.selectedMonthlyReport;
      expect(selectedReport.behaviorCredits).toBe(8); // 5 + 3
      expect(selectedReport.programCredits).toBe(9); // 7 + 2
      expect(selectedReport.educationCredits).toBe(20); // 12 + 8
      expect(selectedReport.treatmentCredits).toBe(6);
    });

    it("should handle null creditsEarned values", () => {
      const nullCreditsActivity = [
        {
          creditDate: new Date("2024-12-15"),
          creditType: "BEHAVIOR" as const,
          creditsEarned: null,
        },
        {
          creditDate: new Date("2024-12-20"),
          creditType: "PROGRAM" as const,
          creditsEarned: 10,
        },
      ];
      const resident = createMockResident("US_TN", nullCreditsActivity);
      const presenter = new UsTnMonthlyReportsPresenter(resident);

      const selectedReport = presenter.selectedMonthlyReport;
      expect(selectedReport.behaviorCredits).toBe(0);
      expect(selectedReport.programCredits).toBe(10);
    });
  });

  describe("setSelectedSearchOption", () => {
    it("should update the selected search option", () => {
      const resident = createMockResident("US_TN", mockCreditActivity);
      const presenter = new UsTnMonthlyReportsPresenter(resident);

      presenter.setSelectedSearchOption("November 2024");

      expect(presenter.selectedSearchOption).toEqual({
        value: "November 2024",
        label: "November 2024",
      });

      const selectedReport = presenter.selectedMonthlyReport;
      expect(selectedReport.formattedMonth).toBe("November 2024");
      expect(selectedReport.educationCredits).toBe(15);
      expect(selectedReport.treatmentCredits).toBe(8);
    });

    it("should throw an error for invalid date", () => {
      const resident = createMockResident("US_TN", mockCreditActivity);
      const presenter = new UsTnMonthlyReportsPresenter(resident);

      expect(() => {
        presenter.setSelectedSearchOption("Invalid Month");
      }).toThrow("No option found for date: Invalid Month");
    });
  });

  describe("credit type mapping", () => {
    it("should correctly map BEHAVIOR and BONUS_BEHAVIOR to behaviorCredits", () => {
      const behaviorActivity = [
        {
          creditDate: new Date("2024-12-15"),
          creditType: "BEHAVIOR" as const,
          creditsEarned: 5,
        },
        {
          creditDate: new Date("2024-12-20"),
          creditType: "BONUS_BEHAVIOR" as const,
          creditsEarned: 3,
        },
      ];
      const resident = createMockResident("US_TN", behaviorActivity);
      const presenter = new UsTnMonthlyReportsPresenter(resident);

      const report = presenter.selectedMonthlyReport;
      expect(report.behaviorCredits).toBe(8);
      expect(report.programCredits).toBe(0);
      expect(report.educationCredits).toBe(0);
      expect(report.treatmentCredits).toBe(0);
    });

    it("should correctly map PROGRAM and BONUS_PROGRAM to programCredits", () => {
      const programActivity = [
        {
          creditDate: new Date("2024-12-15"),
          creditType: "PROGRAM" as const,
          creditsEarned: 7,
        },
        {
          creditDate: new Date("2024-12-20"),
          creditType: "BONUS_PROGRAM" as const,
          creditsEarned: 2,
        },
      ];
      const resident = createMockResident("US_TN", programActivity);
      const presenter = new UsTnMonthlyReportsPresenter(resident);

      const report = presenter.selectedMonthlyReport;
      expect(report.behaviorCredits).toBe(0);
      expect(report.programCredits).toBe(9);
      expect(report.educationCredits).toBe(0);
      expect(report.treatmentCredits).toBe(0);
    });

    it("should correctly map 60_DAY_ED_CREDIT and GED to educationCredits", () => {
      const educationActivity = [
        {
          creditDate: new Date("2024-12-15"),
          creditType: "60_DAY_ED_CREDIT" as const,
          creditsEarned: 12,
        },
        {
          creditDate: new Date("2024-12-20"),
          creditType: "GED" as const,
          creditsEarned: 8,
        },
      ];
      const resident = createMockResident("US_TN", educationActivity);
      const presenter = new UsTnMonthlyReportsPresenter(resident);

      const report = presenter.selectedMonthlyReport;
      expect(report.behaviorCredits).toBe(0);
      expect(report.programCredits).toBe(0);
      expect(report.educationCredits).toBe(20);
      expect(report.treatmentCredits).toBe(0);
    });

    it("should correctly map 60_DAY_TREATMENT to treatmentCredits", () => {
      const treatmentActivity = [
        {
          creditDate: new Date("2024-12-15"),
          creditType: "60_DAY_TREATMENT" as const,
          creditsEarned: 6,
        },
      ];
      const resident = createMockResident("US_TN", treatmentActivity);
      const presenter = new UsTnMonthlyReportsPresenter(resident);

      const report = presenter.selectedMonthlyReport;
      expect(report.behaviorCredits).toBe(0);
      expect(report.programCredits).toBe(0);
      expect(report.educationCredits).toBe(0);
      expect(report.treatmentCredits).toBe(6);
    });
  });
});
