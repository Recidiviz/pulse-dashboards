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

import { UsMaEgtCopy, usMaEGTCopy } from "../../../configs/US_MA/copy";
import { UsMaEGTMonthlyReport } from "../../../models/UsMaEGTMonthlyReport";

type SelectOption = { label: string; value: Date };

export function reportSelectOptions(
  reports: UsMaEGTMonthlyReport[],
): Array<SelectOption> {
  return (
    reports
      .map((report) => {
        return {
          value: report.reportStartDate,
          label: report.fullDisplayName,
        };
      })
      // Sort descending
      .sort((a, b) => b.value.getTime() - a.value.getTime())
  );
}

export function mapRatingToDisplayName(rating: string | null): string {
  const { creditRatings } = usMaEGTCopy;

  return creditRatings[rating as keyof typeof creditRatings] ?? "Unknown";
}

export class MonthlyReportPresenter {
  private selectedMonthYearStartDate?: Date;

  constructor(
    private monthlyReports: UsMaEGTMonthlyReport[],
    private copy: UsMaEgtCopy,
  ) {
    makeAutoObservable(this, undefined, { autoBind: true });
    this.setSelectedMonthYearStartDate(this.latestReport.reportStartDate);
  }

  setSelectedMonthYearStartDate(date: Date) {
    this.selectedMonthYearStartDate = date;
  }

  get homepageCopy() {
    return this.copy.home.monthlyReport;
  }

  get individualReportCopy() {
    return this.copy.individualMonthlyReport;
  }

  get sectionTitle(): string {
    return this.homepageCopy.sectionTitle;
  }

  get selectorLabel(): string {
    return this.latestReport.fullDisplayName;
  }

  get selectPlaceholder(): string {
    return this.latestReport.fullDisplayName;
  }

  private get latestReport(): UsMaEGTMonthlyReport {
    return this.monthlyReports.reduce((latest, current) => {
      return latest.reportStartDate.getTime() >
        current.reportStartDate.getTime()
        ? latest
        : current;
    });
  }

  get selectedMonthlyReport(): UsMaEGTMonthlyReport {
    const selectedReport = this.monthlyReports.find(
      (report) => report.reportStartDate === this.selectedMonthYearStartDate,
    );

    // This shouldn't really be thrown
    if (selectedReport === undefined) {
      throw new Error("Selected report date does not exist");
    }

    return selectedReport;
  }

  get sortedSelectOptions(): Array<SelectOption> {
    return (
      this.monthlyReports
        .map((report) => {
          return {
            value: report.reportStartDate,
            label: report.fullDisplayName,
          };
        })
        // Sort descending
        .sort((a, b) => b.value.getTime() - a.value.getTime())
    );
  }

  get totalEGTCreditDays(): number {
    return this.selectedMonthlyReport.totalEGTCreditDays;
  }

  get totalBoostCreditDays(): number {
    return this.selectedMonthlyReport.totalBoostCreditDays;
  }

  get totalCompletionCreditDays(): number {
    return this.selectedMonthlyReport.totalCompletionCreditDays;
  }

  get creditActivity() {
    return this.selectedMonthlyReport.creditActivity;
  }

  ratingDisplayName(rating: string | null): string {
    return mapRatingToDisplayName(rating);
  }
}
