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

import { differenceInDays } from "date-fns/esm";
import startOfToday from "date-fns/startOfToday";
import { makeAutoObservable } from "mobx";

import { JiiStaffAppRouterOutputs } from "~@jii/trpc-types";

import { FilterField, FilterOption, FilterType } from "../../core/models/types";
import { FilterPresenter } from "../../FilterStore/FilterPresenter";
import UsNcRNAFilterStore from "../../FilterStore/UsNcRNAFilterStore";
import { PartialRecord } from "../../utils/typeUtils";
import { WorkflowsStore } from "../../WorkflowsStore";
import { Resident } from "../../WorkflowsStore/Resident";

export type RNAStatusList =
  JiiStaffAppRouterOutputs["staff"]["usNc"]["rnaStatusList"];

export type RNADueTime =
  | "PAST"
  | "NEXT_7_DAYS"
  | "NEXT_30_DAYS"
  | "NEXT_90_DAYS"
  | "OTHER";

export type RNARowData = {
  status: RNAStatusList[number]["status"];
  updatedAt?: RNAStatusList[number]["updatedAt"];
  createdAt?: RNAStatusList[number]["createdAt"];
  completedAt?: RNAStatusList[number]["completedAt"];
  submittedByStaffAt?: RNAStatusList[number]["submittedByStaffAt"];
  person: Resident;
  rnaDueDate?: Date;
  isEnabled: boolean;
  isSubmitted: boolean;
  dueIn: RNADueTime;
};

/**
 * Return an RNADueTime representing the time span between the given date
 * and the current day.
 */
function computeRNADue(dueDate?: Date): RNADueTime {
  if (!dueDate) {
    return "OTHER";
  }

  const today = startOfToday();
  if (dueDate <= today) {
    return "PAST";
  }

  const daysUntilDue = differenceInDays(dueDate, today);
  if (daysUntilDue <= 7) {
    return "NEXT_7_DAYS";
  } else if (daysUntilDue <= 30) {
    return "NEXT_30_DAYS";
  } else if (daysUntilDue <= 90) {
    return "NEXT_90_DAYS";
  } else {
    return "OTHER";
  }
}

/**
 * Connects information from the JII backend about residents' RNA progress
 * with information about filter state provided by the UsNcRNAFilterStore
 * to manage the set of residents shown in the table.
 */
export class RNAFilterPresenter implements FilterPresenter<UsNcRNAFilterStore> {
  constructor(
    private data: RNAStatusList,
    readonly filterStore: UsNcRNAFilterStore,
    private workflowsStore: WorkflowsStore,
  ) {
    makeAutoObservable(this);
  }

  get queryData(): RNARowData[] {
    return this.data.flatMap((result) => {
      const person =
        this.workflowsStore.justiceInvolvedPersons[result.pseudonymizedId];

      // we don't expect this to actually filter anyone out:
      // this is just to help TS narrow the types to NC residents
      if (
        !person ||
        !(person instanceof Resident) ||
        person.metadata.stateCode !== "US_NC"
      ) {
        return [];
      }

      return [
        {
          ...result,
          person,
          rnaDueDate: person.metadata.rnaDueDate,
          // TODO: These are inaccurate placeholders, get these from the backend.
          isEnabled: result.status !== "UPCOMING",
          isSubmitted: result.status === "SUBMITTED_BY_STAFF",
          dueIn: computeRNADue(person.metadata.rnaDueDate),
        },
      ];
    });
  }

  rowMatchesFilters(
    row: RNARowData,
    filters: PartialRecord<FilterField, FilterOption["value"][]>,
  ): boolean {
    const filtersForType = Object.entries(filters);

    return filtersForType.every(([field, options]) =>
      // @ts-expect-error searchable fields are restricted to strings but TS does not know that
      options.includes(row[field]),
    );
  }

  get filteredQueryData(): RNARowData[] {
    return this.queryData.filter((r) =>
      this.rowMatchesFilters(r, this.filterStore.selectedFilters),
    );
  }

  trackFilterDropdownOpened() {
    // TODO(#10892): add tracking
  }

  numItems(type: FilterType, field: FilterField, option: FilterOption): number {
    // All filters should have this type, so this count doesn't matter
    if (type !== "usNcRNA") {
      return 0;
    }

    return this.queryData.filter((r) =>
      this.rowMatchesFilters(r, { [field]: [option.value] }),
    ).length;
  }
}
