// Recidiviz - a data platform for criminal justice reform
// Copyright (C) 2024 Recidiviz, Inc.
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

import { SortDirection } from "@tanstack/react-table";
import { flowResult, makeAutoObservable } from "mobx";

import {
  Hydratable,
  HydratesFromSource,
  HydrationState,
} from "~hydration-utils";

import {
  CaseListTableCase,
  RecommendationStatusFilter,
} from "../components/Dashboard/types";
import { StaffStore } from "../datastores/StaffStore";

export class StaffPresenter implements Hydratable {
  private hydrator: HydratesFromSource;

  constructor(public readonly staffStore: StaffStore) {
    makeAutoObservable(this, undefined, { autoBind: true });
    this.hydrator = new HydratesFromSource({
      expectPopulated: [
        () => {
          if (this.staffStore.staffInfo === undefined)
            throw new Error("Failed to load staff info");
        },
      ],
      populate: async () => {
        await flowResult(this.staffStore.loadStaffInfo());
      },
    });
  }

  get stateCode() {
    return this.staffStore.stateCode;
  }

  get staffPseudoId() {
    return this.staffStore.psiStore.staffPseudoId;
  }

  get staffInfo() {
    return this.staffStore.staffInfo;
  }

  get caseTableData() {
    return !this.staffInfo ? undefined : this.staffInfo.cases;
  }

  get hydrationState(): HydrationState {
    return this.hydrator.hydrationState;
  }

  async hydrate(): Promise<void> {
    return this.hydrator.hydrate();
  }

  async setIsFirstLogin() {
    if (!this.staffPseudoId) return;
    return this.staffStore.psiStore.apiClient.setIsFirstLogin(
      this.staffPseudoId,
    );
  }

  trackDashboardPageViewed(): void {
    this.staffStore.psiStore.analyticsStore.trackDashboardPageViewed({
      viewedBy: this.staffPseudoId,
    });
  }

  trackRecommendationStatusFilterChanged(
    filters: RecommendationStatusFilter[],
  ): void {
    this.staffStore.psiStore.analyticsStore.trackRecommendationStatusFilterChanged(
      {
        viewedBy: this.staffPseudoId,
        filters,
      },
    );
  }

  trackIndividualCaseClicked(
    caseId: string,
    recommendationStatus: CaseListTableCase["status"],
  ): void {
    this.staffStore.psiStore.analyticsStore.trackIndividualCaseClicked({
      viewedBy: this.staffPseudoId,
      status: recommendationStatus,
      caseId,
    });
  }

  trackDashboardSortOrderChanged(
    sortDirection: false | SortDirection,
    columnName?: string,
  ): void {
    this.staffStore.psiStore.analyticsStore.trackDashboardSortOrderChanged({
      viewedBy: this.staffPseudoId,
      order: sortDirection,
      columnName,
    });
  }
}
