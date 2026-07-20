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

import { makeAutoObservable } from "mobx";

import { RootStore } from "../../../RootStore";
import AnalyticsStore from "../../../RootStore/AnalyticsStore";
import {
  Client,
  JusticeInvolvedPerson,
  WorkflowsStore,
} from "../../../WorkflowsStore";
import RoutePlannerClientStore from "../ClientStore/ClientStoreBase";

export type TableColumnId =
  | "SELECTED"
  | "PERSON_NAME"
  | "PERSON_DISPLAY_ID"
  | "ASSIGNED_STAFF_NAME"
  | "CLIENT_SUPERVISION_TYPE"
  | "LEVEL"
  | "ADDRESS";
export class RoutePlannerTablePresenter {
  private readonly analyticsStore: AnalyticsStore;
  private readonly workflowsStore: WorkflowsStore;
  private readonly routePlannerClientStore: RoutePlannerClientStore;

  private selectedPeople: Client[] = [];

  constructor(
    private readonly rootStore: RootStore,
    private readonly clientStore: RoutePlannerClientStore,
  ) {
    this.routePlannerClientStore = clientStore;
    this.workflowsStore = this.rootStore.workflowsStore;
    this.analyticsStore = this.workflowsStore.rootStore.analyticsStore;

    this.selectedPeople = [];

    makeAutoObservable(this, {}, { autoBind: true });
  }

  // BUTTONS
  onCancel() {
    this.routePlannerClientStore.updateShowWindow();
  }

  onClickAdd() {
    this.routePlannerClientStore.updateShowWindow();
  }

  isSelected(people: Client) {
    return false;
  }

  get numberOfSelected(): number {
    return 0;
  }

  get people(): Client[] {
    return this.rootStore.workflowsStore.searchStore.caseloadPersons.filter(
      (person: JusticeInvolvedPerson) => person instanceof Client,
    );
  }

  get displayIdHeader(): string {
    return this.rootStore.tenantStore.getDisplayIdCopy(
      this.rootStore.workflowsStore.activeSystem,
    );
  }
}
