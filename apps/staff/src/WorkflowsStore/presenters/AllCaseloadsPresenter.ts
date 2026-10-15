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
      this.isClientsResidentsTableViewToggleEnabled &&
      !this.showClassificationTable
    );
  }

  get showClientsResidentsTable(): boolean {
    return this.showTableViewToggle && !this.showListView;
  }

  get showClassificationTable(): boolean {
    const {
      currentTenantId,
      userStore: { activeFeatureVariants },
      workflowsStore: { activeSystem },
    } = this.rootStore;

    const TnClassification = !!(
      activeFeatureVariants.usTn2026ClassificationPolicyPilot &&
      currentTenantId === "US_TN"
    );

    const MiClassification = !!(
      activeFeatureVariants.usMiDisplayClassificationTable &&
      currentTenantId === "US_MI"
    );

    const applicableClassifications = TnClassification || MiClassification;

    return applicableClassifications && activeSystem === "INCARCERATION";
  }

  get isTypesenseSearchEnabled(): boolean {
    return this.rootStore.workflowsStore.searchStore.isTypesenseSearchEnabled;
  }

  get initialHeaderText(): string {
    const people = `${toTitleCase(
      this.rootStore.workflowsStore.justiceInvolvedPersonTitle,
    )}s`;
    return this.isTypesenseSearchEnabled ? people : `All ${people}`;
  }

  get initialCallToActionText(): string {
    const {
      workflowsStore: {
        activeSystem,
        searchStore: { workflowsSearchFieldTitle },
      },
    } = this.rootStore;

    if (this.isTypesenseSearchEnabled) {
      return activeSystem === "INCARCERATION"
        ? "Search a facility to see the people in it."
        : "Search for someone's caseload to see the people on it.";
    }

    return `Search for ${workflowsSearchFieldTitle} above to view their entire caseload.`;
  }

  get isInitial(): boolean {
    return !this.rootStore.workflowsStore.searchStore.selectedSearchIds.length;
  }

  // True once the selected caseload has loaded with at least one person (matches
  // CaseloadHydrator's "hydrated" state).
  get hasResults(): boolean {
    const { workflowsStore } = this.rootStore;
    return (
      !this.isInitial &&
      workflowsStore.caseloadLoaded() &&
      workflowsStore.caseloadPersons.length > 0
    );
  }

  get headerCallToActionText(): string | undefined {
    return this.isInitial ? this.initialCallToActionText : undefined;
  }

  // Whether to show the table-view toggle in line with the search bar (typesense
  // FV, once results are in). `showTableViewToggle` is reused by the non-FV
  // results header, so the search-row-specific conditions live here.
  get showTableViewToggleInSearchRow(): boolean {
    return (
      this.isTypesenseSearchEnabled &&
      this.hasResults &&
      this.showTableViewToggle
    );
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
