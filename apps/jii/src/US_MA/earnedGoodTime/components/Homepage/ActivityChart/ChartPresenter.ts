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

import { max, range, rollup, sum } from "d3-array";
import { makeAutoObservable } from "mobx";

import { UsMaEarnedCreditType, usMaEarnedCreditTypes } from "~datatypes";

import { UsMaEGTMonthlyReport } from "../../../models/UsMaEGTMonthlyReport";

export type ChartDatum = {
  creditMonth: string;
  creditType: UsMaEarnedCreditType;
  totalCredits: number;
};

const formatMonth = Intl.DateTimeFormat(undefined, { month: "short" });
function formatCreditDate(d: Date) {
  return formatMonth.format(d);
}

export class ChartPresenter {
  constructor(private monthlyReports: Array<UsMaEGTMonthlyReport>) {
    makeAutoObservable(this);
  }

  get chartData(): Array<ChartDatum> {
    return this.monthlyReports.flatMap((r) =>
      usMaEarnedCreditTypes.options.map((creditType) => ({
        creditType,
        creditMonth: formatCreditDate(r.reportStartDate),
        totalCredits: r.getTotalCreditForCreditType(creditType),
      })),
    );
  }

  get rangeExtent() {
    const monthlyTotals = rollup(
      this.chartData,
      (v) => sum(v.map((d) => d.totalCredits)),
      // note that this only works if there are 12 or fewer months of data,
      // which we expect to always be the case here
      (d) => d.creditMonth,
    );
    // should not ever be undefined but we're being type safe
    const monthlyMax = max(monthlyTotals.values()) ?? 0;

    // round up to nearest multiple of 10 for a cleaner axis
    return Math.ceil(monthlyMax / 10) * 10;
  }

  get axisTicks() {
    // for larger ranges let the chart library do whatever it wants
    if (this.rangeExtent > 40) return;
    // for smaller ranges we can ensure nicer values, since we know we'll have space for them
    return range(
      0,
      // nudging the value up so the end is inclusive of the extent
      this.rangeExtent + 0.1,
      // display multiples of 5
      5,
    );
  }
}
