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

import { usTnCopy } from "../../configs/copy";
import { UsTnMonthlyReport } from "../UsTnSingleResidentDataContext/context";

export class UsTnSingleMonthCreditReportPresenter {
  constructor(
    public readonly resident: ResidentRecord,
    public readonly monthSlug: string,
    public readonly monthlyReport?: UsTnMonthlyReport,
  ) {}

  get displayMonth(): string {
    return this.monthlyReport?.formattedMonth ?? "";
  }

  get totalMonthlyCredits(): number {
    const { monthlyReport } = this;

    if (!monthlyReport) return 0;

    return monthlyReport.totalCredits;
  }

  get creditEntries(): [string, number][] {
    const { monthlyReport } = this;

    if (!monthlyReport) return [];

    return monthlyReport.reports
      .filter((report) => report.creditType !== null)
      .map((report) => [
        // @ts-expect-error We filter out reports with null creditType above
        usTnCopy.monthlyCreditReportSummary.creditTypes[report.creditType],
        report.creditsEarned ?? 0,
      ]);
  }
}
