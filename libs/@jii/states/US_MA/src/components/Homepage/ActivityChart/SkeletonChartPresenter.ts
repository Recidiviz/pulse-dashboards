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

import { range } from "d3-array";
import { makeAutoObservable } from "mobx";

import { usMaEarnedCreditTypes } from "~datatypes";

import { ChartDatum, ChartPresenterInterface } from "./types";

// Skeleton presenter that hardcodes all the structure we need
export class SkeletonChartPresenter implements ChartPresenterInterface {
  constructor() {
    makeAutoObservable(this);
  }

  get isSkeleton() {
    return true;
  }

  get chartData(): Array<ChartDatum> {
    // Generate 6 months of skeleton data with 0 values
    const now = new Date();
    const months: Array<ChartDatum> = [];

    for (let i = 5; i >= 0; i--) {
      const creditMonth = new Date(now.getFullYear(), now.getMonth() - i, 1);

      usMaEarnedCreditTypes.options.forEach((creditType) => {
        months.push({
          creditType,
          creditMonth,
          totalCredits: 0,
        });
      });
    }

    return months;
  }

  get axisTicks() {
    return range(0, 21, 5); // [0, 5, 10, 15, 20]
  }
}
