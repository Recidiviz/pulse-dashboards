// Recidiviz - a data platform for criminal justice reform
// Copyright (C) 2026 Recidiviz, Inc.
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

import { format } from "date-fns";
import { groupBy, mapValues } from "lodash";
import { makeAutoObservable } from "mobx";

import {
  UsCoCreditType,
  UsCoEarnedCreditActivity,
  UsCoResidentMetadata,
  WorkflowsResidentRecord,
} from "~datatypes";

export type UsCoMonthlyReport = {
  monthSlug: string;
  date: Date;
  totalCredits: number;
  activities: UsCoEarnedCreditActivity[];
  creditEntries: [UsCoCreditType, number][];
};

type UsCoMonthlyReports = Record<string, UsCoMonthlyReport>;

// the order categories are displayed in on the single-month report
const CREDIT_TYPE_ORDER: UsCoCreditType[] = [
  "EARNED_TIME",
  "GOOD_TIME",
  "ACHIEVEMENT",
  "PROJECTED_EARNED_TIME_FINAL_3_MONTHS",
  "OTHER",
];

/**
 * Aggregates a resident's flat `creditActivity` list into per-month reports,
 * keyed by a locale-stable month slug (e.g. "2024-12"), with credits bucketed
 * by type.
 */
function processMonthlyReports(
  metadata: UsCoResidentMetadata,
): UsCoMonthlyReports {
  const monthlyReports: UsCoMonthlyReports = {};

  metadata.creditActivity.forEach((record) => {
    const { creditDate, creditType: rawCreditType, creditsEarned } = record;

    if (creditsEarned === undefined) return;
    const creditType = rawCreditType ?? "OTHER";

    const monthSlug = format(creditDate, "yyyy-MM");

    if (!monthlyReports[monthSlug]) {
      monthlyReports[monthSlug] = {
        monthSlug,
        date: creditDate,
        activities: [],
        totalCredits: 0,
        creditEntries: CREDIT_TYPE_ORDER.map((type) => [type, 0]),
      };
    }

    monthlyReports[monthSlug].activities.push(record);

    monthlyReports[monthSlug].totalCredits += creditsEarned;

    monthlyReports[monthSlug].creditEntries[
      CREDIT_TYPE_ORDER.indexOf(creditType)
    ][1] += creditsEarned;
  });

  return mapValues(monthlyReports, (report) => ({
    ...report,
    creditEntries: report.creditEntries.filter(([, credits]) => credits !== 0),
  }));
}

export class UsCoCreditReportPresenter {
  readonly monthlyReports: UsCoMonthlyReports;

  constructor(
    public readonly resident: WorkflowsResidentRecord,
    metadata: UsCoResidentMetadata,
  ) {
    this.monthlyReports = processMonthlyReports(metadata);
    makeAutoObservable(this, undefined, { autoBind: true });
  }

  get groupedReportsByYear(): Record<string, UsCoMonthlyReport[]> {
    const reportsByYear = groupBy(
      Object.values(this.monthlyReports),
      (report) => report.date.getFullYear(),
    );

    return mapValues(reportsByYear, (reports) =>
      reports.sort((a, b) => b.date.getTime() - a.date.getTime()),
    );
  }

  get orderedYears(): string[] {
    return Object.keys(this.groupedReportsByYear).sort().reverse();
  }

  get mostRecentReports(): UsCoMonthlyReport[] {
    return Object.values(this.monthlyReports)
      .sort((a, b) => (b.date > a.date ? 1 : -1))
      .slice(0, 8);
  }
}
