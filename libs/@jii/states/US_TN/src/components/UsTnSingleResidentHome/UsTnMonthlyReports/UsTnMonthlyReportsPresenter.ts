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

import { WorkflowsResidentRecord } from "~datatypes";

import {
  UsTnMonthlyReport,
  UsTnMonthlyReports,
} from "../../UsTnSingleResidentDataContext/context";

export class UsTnMonthlyReportsPresenter {
  constructor(
    public readonly resident: WorkflowsResidentRecord,
    private readonly monthlyReports: UsTnMonthlyReports,
  ) {
    makeAutoObservable(this, undefined, { autoBind: true });
  }

  get mostRecentReports(): UsTnMonthlyReport[] {
    return Object.values(this.monthlyReports)
      .sort((a, b) => (b.date > a.date ? 1 : -1))
      .slice(0, 8);
  }
}
