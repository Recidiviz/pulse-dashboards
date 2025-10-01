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

import { UsTnResidentMetadata } from "~datatypes";

import { processMonthlyReports } from "./DataContext";

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

  const createMockResidentMetadata = (
    stateCode: string,
    creditActivity: {
      creditDate: Date;
      creditType: string;
      creditsEarned: number | null;
    }[] = [],
  ): UsTnResidentMetadata =>
    ({ stateCode, creditActivity }) as never as UsTnResidentMetadata;

  describe("processMonthlyReports", () => {
    const processedReports = processMonthlyReports(
      createMockResidentMetadata("US_TN", mockCreditActivity),
    );

    it("should aggregate monthly reports into an object keyed by month of report", () => {
      expect(Object.keys(processedReports)).toHaveLength(3);

      expect(processedReports["december-2024"]).toEqual({
        formattedMonth: "December 2024",
        monthSlug: "december-2024",
        month: new Date("2024-12-31"),
        behaviorCredits: 5,
        programCredits: 10,
        educationCredits: 0,
        treatmentCredits: 0,
        creditRemovals: 0,
        totalCredits: 15,
        reports: mockCreditActivity.slice(0, 2),
      });

      expect(processedReports["november-2024"]).toEqual({
        formattedMonth: "November 2024",
        monthSlug: "november-2024",
        month: new Date("2024-11-30"),
        behaviorCredits: 0,
        programCredits: 0,
        educationCredits: 15,
        treatmentCredits: 8,
        creditRemovals: 0,
        totalCredits: 23,
        reports: mockCreditActivity.slice(2, 4),
      });

      expect(processedReports["october-2024"]).toEqual({
        formattedMonth: "October 2024",
        monthSlug: "october-2024",
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
});
