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

import { pluralizeWord } from "~utils";

import type { ClientsResidentsTableColumnId } from "../../core/CaseloadView/AllCaseloadsTable/utils";
import { formatSupervisionEndDatePhrase } from "../../core/WorkflowsJusticeInvolvedPersonProfile/utils";
import { RootStore } from "../../RootStore";
import { toTitleCase } from "../../utils";
import type { JusticeInvolvedPerson } from "../types";
import { TableViewSelectInterface } from "./TableViewSelectPresenter";

export class AllCaseloadsPresenter implements TableViewSelectInterface {
  constructor(private readonly rootStore: RootStore) {
    makeAutoObservable<this, "rootStore">(
      this,
      {
        rootStore: false,
      },
      { autoBind: true },
    );
  }

  get showListView(): boolean {
    return (
      this.rootStore.workflowsStore.userUpdatesSubscription?.data
        ?.clientsResidentsShowListView ?? true
    );
  }

  set showListView(showListView: boolean) {
    this.rootStore.firestoreStore.updateClientsResidentsViewPreference(
      showListView,
    );
  }

  get showTableViewToggle(): boolean {
    return (
      this.isClientsResidentsTableViewToggleEnabled && !this.showTnPilotTable
    );
  }

  get showClientsResidentsTable(): boolean {
    return this.showTableViewToggle && !this.showListView;
  }

  get showTnPilotTable(): boolean {
    const {
      currentTenantId,
      userStore: { activeFeatureVariants },
      workflowsStore: { activeSystem },
    } = this.rootStore;

    return !!(
      activeFeatureVariants.usTn2026ClassificationPolicyPilot &&
      currentTenantId === "US_TN" &&
      activeSystem === "INCARCERATION"
    );
  }

  get initialHeaderText(): string {
    return `All ${toTitleCase(
      this.rootStore.workflowsStore.justiceInvolvedPersonTitle,
    )}s`;
  }

  get initialCallToActionText(): string {
    const {
      workflowsStore: {
        searchStore: { workflowsSearchFieldTitle },
      },
    } = this.rootStore;

    return `Search for ${pluralizeWord({
      term: workflowsSearchFieldTitle,
      justAppendS: this.searchTitleIgnoreCase,
    })} above to view their entire caseload.`;
  }

  get hydratedHeaderText(): string {
    return `${this.initialHeaderText} (${this.caseloadPersonCount})`;
  }

  get people(): JusticeInvolvedPerson[] {
    return this.rootStore.workflowsStore.searchStore.caseloadPersons;
  }

  get dateHeader(): string {
    const {
      tenantStore: { labels },
      workflowsStore: { activeSystem },
    } = this.rootStore;
    if (activeSystem === "SUPERVISION") {
      return formatSupervisionEndDatePhrase(labels.supervisionEndDateCopy);
    }
    return labels.releaseDateCopy;
  }

  get levelHeader(): string {
    return this.rootStore.workflowsStore.activeSystem === "SUPERVISION"
      ? "Supervision Level"
      : "Custody Level";
  }

  get displayIdHeader(): string {
    return this.rootStore.tenantStore.getDisplayIdCopy(
      this.rootStore.workflowsStore.activeSystem,
    );
  }

  get assignedStaffTitle(): string {
    const {
      tenantStore: { labels },
      workflowsStore: { activeSystem },
    } = this.rootStore;

    return activeSystem === "INCARCERATION"
      ? labels.incarcerationStaffTitle.toLowerCase()
      : "supervisor";
  }

  get enabledColumnIds(): Record<ClientsResidentsTableColumnId, boolean> {
    const isSupervision =
      this.rootStore.workflowsStore.activeSystem === "SUPERVISION";
    const isUsMiIncarceration =
      this.rootStore.workflowsStore.activeSystem === "INCARCERATION" &&
      this.rootStore.currentTenantId === "US_MI";

    return {
      PERSON_NAME: true,
      PERSON_DISPLAY_ID: true,
      RELEASE_DATE: true,
      ASSIGNED_STAFF_NAME: true,
      CLIENT_SUPERVISION_TYPE: isSupervision,
      LEVEL: true,
      US_MI_RESIDENT_LOCK: isUsMiIncarceration,
      US_MI_RESIDENT_SEG_TYPE: isUsMiIncarceration,
    };
  }

  private get caseloadPersonCount(): number {
    return this.rootStore.workflowsStore.searchStore.caseloadPersons.length;
  }

  private get isClientsResidentsTableViewToggleEnabled(): boolean {
    return !!this.rootStore.userStore.activeFeatureVariants
      .clientsResidentsTableViewToggle;
  }

  private get searchTitleIgnoreCase(): boolean | undefined {
    const {
      activeSystemConfig,
      searchStore: { searchType },
    } = this.rootStore.workflowsStore;

    return activeSystemConfig?.search.find(
      (search) => search.searchType === searchType,
    )?.searchTitleIgnoreCase;
  }
}
