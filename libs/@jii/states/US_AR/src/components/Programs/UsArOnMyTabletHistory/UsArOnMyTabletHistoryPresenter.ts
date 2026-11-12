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

import { groupBy } from "lodash";
import { makeAutoObservable } from "mobx";

import { UsArEdovoCreditActivity, UsArResidentJiiData } from "~@jii/schemas";

export class UsArOnMyTabletHistoryPresenter {
  constructor(private metadata: UsArResidentJiiData) {
    makeAutoObservable(this);
  }

  get sortedMonths(): UsArEdovoCreditActivity[] {
    return [...this.metadata.creditActivity].sort(
      (a, b) => b.completionMonth.getTime() - a.completionMonth.getTime(),
    );
  }

  get groupedMonthsByYear(): Record<string, UsArEdovoCreditActivity[]> {
    return groupBy(this.sortedMonths, (activity) =>
      activity.completionMonth.getFullYear(),
    );
  }

  get orderedYears(): string[] {
    return Object.keys(this.groupedMonthsByYear).sort().reverse();
  }
}
