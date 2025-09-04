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

import { makeAutoObservable } from "mobx";

import { ResidentRecord, UsTnCreditActivity } from "~datatypes";

export type UsTnMonthlyReport = {
  formattedMonth: string;
  month: Date;
  behaviorCredits: number;
  educationCredits: number;
  programCredits: number;
  treatmentCredits: number;
  totalCredits: number;
  reports: UsTnCreditActivity[];
};

type UsTnMonthlyReports = Record<string, UsTnMonthlyReport>;

type SelectorOption = {
  value: string;
  label: string;
};

export class UsTnMonthlyReportsPresenter {
  private _selectedSearchOption: SelectorOption;
  private readonly monthlyReports: UsTnMonthlyReports;

  constructor(public readonly resident: ResidentRecord) {
    makeAutoObservable(this, undefined, { autoBind: true });
    this.monthlyReports = processMonthlyReports(resident);
    this._selectedSearchOption = this.monthlyReportOptions[0];
  }

  get monthlyReportOptions(): SelectorOption[] {
    return Object.values(this.monthlyReports)
      .sort((a, b) => (b.month > a.month ? 1 : -1))
      .map(({ formattedMonth }) => ({
        value: formattedMonth,
        label: formattedMonth,
      }));
  }

  get selectedSearchOption(): SelectorOption {
    return this._selectedSearchOption;
  }

  get selectedMonthlyReport(): UsTnMonthlyReport {
    const selectedMonth = this._selectedSearchOption.value;
    const report = this.monthlyReports[selectedMonth];

    if (!report) {
      // This shouldn't happen, but let's be type-safe
      throw new Error(
        `No monthly report found for selected month: ${selectedMonth}`,
      );
    }
    return report;
  }

  setSelectedSearchOption(date: string) {
    const newOption = this.monthlyReportOptions.find(
      (option) => option.value === date,
    );

    if (!newOption) {
      // This shouldn't happen, but let's be type-safe
      throw new Error(`No option found for date: ${date}`);
    }

    this._selectedSearchOption = newOption;
  }
}

export function processMonthlyReports(
  resident: ResidentRecord,
): UsTnMonthlyReports {
  const { metadata } = resident;
  if (metadata.stateCode !== "US_TN") {
    return {};
  }

  const monthlyReports: UsTnMonthlyReports = {};

  metadata.creditActivity.forEach((record) => {
    const { creditDate, creditType, creditsEarned } = record;

    const formattedMonth = Intl.DateTimeFormat("en-US", {
      month: "long",
      year: "numeric",
    }).format(creditDate);

    if (!monthlyReports[formattedMonth]) {
      monthlyReports[formattedMonth] = {
        formattedMonth,
        month: creditDate,
        behaviorCredits: 0,
        programCredits: 0,
        educationCredits: 0,
        treatmentCredits: 0,
        reports: [],
        totalCredits: 0,
      };
    }

    monthlyReports[formattedMonth].reports.push(record);

    const credits = creditsEarned ?? 0;
    monthlyReports[formattedMonth].totalCredits += credits;

    switch (creditType) {
      case "BEHAVIOR":
      case "BONUS_BEHAVIOR":
        monthlyReports[formattedMonth].behaviorCredits += credits;
        break;
      case "PROGRAM":
      case "BONUS_PROGRAM":
        monthlyReports[formattedMonth].programCredits += credits;
        break;
      case "60_DAY_ED_CREDIT":
      case "GED":
        monthlyReports[formattedMonth].educationCredits += credits;
        break;
      case "60_DAY_TREATMENT":
        monthlyReports[formattedMonth].treatmentCredits += credits;
    }
  });

  return monthlyReports;
}
