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

import { groupBy, mapValues } from "lodash";

import { ResidentRecord } from "~datatypes";

import {
  UsTnMonthlyReport,
  UsTnMonthlyReports,
} from "../UsTnSingleResidentDataContext/context";

export class UsTnAllMonthCreditReportPresenter {
  constructor(
    public readonly resident: ResidentRecord,
    public readonly monthlyReports: UsTnMonthlyReports,
  ) {}

  get groupedReportsByYear(): Record<string, UsTnMonthlyReport[]> {
    const reportsByYear = groupBy(this.monthlyReports, (report) =>
      report.date.getFullYear(),
    );

    return mapValues(reportsByYear, (reports) =>
      reports.sort((a, b) => b.date.getTime() - a.date.getTime()),
    );
  }

  get orderedYears(): string[] {
    return Object.keys(this.groupedReportsByYear).sort().reverse();
  }
}
