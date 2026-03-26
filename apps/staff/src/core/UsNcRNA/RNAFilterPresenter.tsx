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

import { UseSuspenseQueryResult } from "@tanstack/react-query";
import { TRPCClient } from "@trpc/client";
import { differenceInDays } from "date-fns/esm";
import startOfToday from "date-fns/startOfToday";
import { makeAutoObservable, runInAction } from "mobx";

import { JiiStaffAppRouter, JiiStaffAppRouterOutputs } from "~@jii/trpc-types";

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
  | "MORE_THAN_90_DAYS"
  | "OTHER";

export type RNARowData = Exclude<RNAStatusList[number], "pseudonymizedId"> & {
  person: Resident;
  rnaDueDate?: Date;

  // Auxiliary information for filters
  isEnabled: boolean;
  isSubmitted: boolean;
  dueIn: RNADueTime;

  presenter: RNAFilterPresenter;
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
    return "MORE_THAN_90_DAYS";
  }
}

/**
 * Connects information from the JII backend about residents' RNA progress
 * with information about filter state provided by the UsNcRNAFilterStore
 * to manage the set of residents shown in the table.
 */
export class RNAFilterPresenter implements FilterPresenter<UsNcRNAFilterStore> {
  // tracks outstanding backend requests, to prevent sending more than one request
  // per person at a time
  private currentlyUpdatingPseudoIds: Set<string>;

  constructor(
    private data: RNAStatusList,
    private refetchAllTableData: UseSuspenseQueryResult<
      RNAStatusList,
      any
    >["refetch"],
    readonly filterStore: UsNcRNAFilterStore,
    private workflowsStore: WorkflowsStore,
    private trpcClient: TRPCClient<JiiStaffAppRouter>,
  ) {
    this.currentlyUpdatingPseudoIds = new Set();

    makeAutoObservable<this, "trpcClient" | "refetch">(
      this,
      { trpcClient: false, refetch: false },
      { autoBind: true },
    );
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

      const rnaDueDate = person.metadata.rnaDueDate;

      return [
        {
          ...result,
          person,
          rnaDueDate,
          isEnabled: !!result.enabledAt,
          isSubmitted: result.status === "SUBMITTED_BY_STAFF",
          dueIn: computeRNADue(rnaDueDate),
          presenter: this,
        },
      ];
    });
  }

  /**
   * Return true when there is currently an outstanding backend request for the person
   * with given pseudo ID
   */
  isUpdating(pseudonymizedId: string): boolean {
    return this.currentlyUpdatingPseudoIds.has(pseudonymizedId);
  }

  /**
   * Enable the assessment for the person with given pseudo ID. If the assessment ID
   * is provided, an assessment already exists, so set it to enabled; if not,
   * create a new assessment for the person. Then, if a change was made,
   * refetch all table data.
   *
   * This should not be called for someone who is already being updated.
   */
  async onEnableClick(pseudonymizedId: string, assessmentId?: string) {
    this.currentlyUpdatingPseudoIds.add(pseudonymizedId);

    if (assessmentId) {
      await this.trpcClient.staff.usNc.setRNAEnabled.mutate({
        id: assessmentId,
      });
    } else {
      await this.trpcClient.staff.usNc.createRNA.mutate({
        pseudonymizedId: pseudonymizedId,
      });
    }
    await this.refetchAllTableData();

    runInAction(() => {
      this.currentlyUpdatingPseudoIds.delete(pseudonymizedId);
    });
  }

  /**
   * Disable the assessment with given assessment ID, which is assigned to
   * the person with given pseudo ID, and refetch all table data if a change was made.
   *
   * The assessment ID should always be provided in real cases when this
   * function is called, but if one isn't, it's fine to do nothing:
   * an assessment doesn't exist to do anything with.
   */
  async onDisableClick(pseudonymizedId: string, assessmentId?: string) {
    if (!assessmentId) return;

    this.currentlyUpdatingPseudoIds.add(pseudonymizedId);

    await this.trpcClient.staff.usNc.setRNADisabled.mutate({
      id: assessmentId,
    });
    await this.refetchAllTableData();

    runInAction(() => {
      this.currentlyUpdatingPseudoIds.delete(pseudonymizedId);
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
