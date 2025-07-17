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

import { UsMaCreditActivity, UsMaEarnedCreditType } from "~datatypes";

export class UsMaEGTMonthlyReport {
  constructor(
    public reportStartDate: Date,
    public creditActivity: UsMaCreditActivity[],
  ) {}

  get displayName(): string {
    return new Intl.DateTimeFormat("en-US", {
      month: "long",
      year: "numeric",
    }).format(this.reportStartDate);
  }

  private getTotalCreditForCreditType(
    creditType: UsMaEarnedCreditType,
  ): number {
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
