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

import { rollup } from "d3-array";
import { format } from "date-fns";

import {
  UsMaCreditActivity,
  UsMaEarnedCreditType,
  UsMaResidentMetadata,
} from "~datatypes";

export function getMonthlyReportPageSlug(date: Date): string {
  return format(date, "yyyy-MM-dd");
}

export class UsMaEGTMonthlyReport {
  constructor(
    public reportStartDate: Date,
    public creditActivity: UsMaCreditActivity[],
  ) {}

  get fullDisplayName(): string {
    return new Intl.DateTimeFormat("en-US", {
      month: "long",
      year: "numeric",
    }).format(this.reportStartDate);
  }

  get displayName(): string {
    return new Intl.DateTimeFormat("en-US", {
      month: "long",
      year: "numeric",
    }).format(this.reportStartDate);
  }

  get pageSlug(): string {
    return format(this.reportStartDate, "yyyy-MM-dd");
  }

  get monthDisplayName(): string {
    return new Intl.DateTimeFormat("en-US", {
      month: "long",
    }).format(this.reportStartDate);
  }

  getTotalCreditForCreditType(creditType: UsMaEarnedCreditType): number {
    return this.creditActivity.reduce((total, credit) => {
      return total + (credit[creditType as UsMaEarnedCreditType] ?? 0);
    }, 0);
  }

  get totalEGTCreditDays(): number {
    return this.getTotalCreditForCreditType("EARNEDGoodTime");
  }

  get totalBoostCreditDays(): number {
    return this.getTotalCreditForCreditType("BOOST");
  }

  get totalCompletionCreditDays(): number {
    return this.getTotalCreditForCreditType("COMPLETION");
  }
}

export function populateUsMaEGTMonthlyReport(
  metadata: UsMaResidentMetadata,
): Array<UsMaEGTMonthlyReport> {
  const { creditActivity } = metadata;

  const reports = [
    ...rollup(
      creditActivity,
      (monthActivities) => {
        return new UsMaEGTMonthlyReport(
          monthActivities[0].creditDate,
          monthActivities,
        );
      },
      (d) => d.creditDate.toISOString(),
    ).values(),
  ];

  return reports;
}
