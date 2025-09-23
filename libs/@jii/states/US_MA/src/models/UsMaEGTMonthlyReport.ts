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
import { format, isAfter } from "date-fns";
import { DeepNonNullable } from "utility-types";

import { EarnedGoodTimeConfig } from "~@jii/data";
import { UsMaTranslationsObject } from "~@jii/translation";
import {
  UsMaCreditActivity,
  UsMaEarnedCreditType,
  UsMaResidentMetadata,
} from "~datatypes";

export type AchievementKey = Exclude<
  keyof UsMaTranslationsObject["individualMonthlyReport"]["achievements"],
  "heading"
>;

export function getMonthlyReportPageSlug(date: Date): string {
  return format(date, "yyyy-MM-dd");
}

type NonEmptyCreditActivity = Omit<UsMaCreditActivity, "activity"> &
  DeepNonNullable<Pick<UsMaCreditActivity, "activity">>;
export class UsMaEGTMonthlyReport {
  constructor(
    public reportStartDate: Date,
    private creditActivityRecords: UsMaCreditActivity[],
    private config: EarnedGoodTimeConfig,
  ) {}

  get pageSlug(): string {
    return getMonthlyReportPageSlug(this.reportStartDate);
  }

  get creditActivity(): Array<NonEmptyCreditActivity> {
    return this.creditActivityRecords.filter(
      // records without an activity string should be placeholders
      // for months where there was no actual activity recorded;
      // filtering them out would give us an empty report for that month
      (record): record is NonEmptyCreditActivity => record.activity !== null,
    );
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

  get achievements(): Array<AchievementKey> {
    const achievementsToShow: Array<AchievementKey> = [];
    if (
      this.config.monthlyEarnedTimeLimit &&
      this.totalEGTCreditDays === this.config.monthlyEarnedTimeLimit
    ) {
      achievementsToShow.push("maxEarnedTime");
    }

    return achievementsToShow;
  }
}

function getValidCreditActivity(metadata: UsMaResidentMetadata) {
  const { creditActivity, lastUpdatedDate } = metadata;

  // activity may be future-dated but it may also be a future-dated placeholder record,
  // because of how missing data is imputed on the backend. These should be
  // dropped so that we don't create any spurious monthly reports for them
  return creditActivity.filter((activity) => {
    if (isAfter(activity.creditDate, lastUpdatedDate)) {
      return activity.activity !== null;
    }
    return true;
  });
}

export function populateUsMaEGTMonthlyReport(
  metadata: UsMaResidentMetadata,
  config: EarnedGoodTimeConfig,
) {
  const creditActivity = getValidCreditActivity(metadata);

  const reports = [
    ...rollup(
      creditActivity,
      (monthActivities) => {
        return new UsMaEGTMonthlyReport(
          monthActivities[0].creditDate,
          monthActivities,
          config,
        );
      },
      (d) => d.creditDate.toISOString(),
    ).values(),
  ];

  return reports;
}
