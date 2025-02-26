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

import assertNever from "assert-never";
import { makeAutoObservable, reaction } from "mobx";

import { SearchableGroup, SearchType, SystemId } from "../core/models/types";
import { CaseloadSearchable } from "./CaseloadSearchable";
import { Location } from "./Location";
import { Officer } from "./Officer";
import { SearchManager } from "./SearchManager";
import { JusticeInvolvedPerson } from "./types";
import { WorkflowsStore } from "./WorkflowsStore";

export class SearchStore {
  workflowsStore: WorkflowsStore;

  clientSearchManager: SearchManager;

  residentSearchManager: SearchManager;

  searchTypeOverride?: SearchType;

  /**
   * Local state to keep track of the selected search ids during impersonation mode, since
   * in impersonation mode the user cannot write to firebase
   */
  selectedSearchIdsForImpersonation: string[] | undefined = undefined;

  /**
   * Local state to keep track of the selected search ids for a user with supervised staff,
   * after the default behavior or auto-setting their search ids (to their own + supervised staff) upon login
   */
  selectedSearchIdsForSupervisorsWithStaff: string[] | undefined = undefined;

  constructor(workflowsStore: WorkflowsStore) {
    this.workflowsStore = workflowsStore;
    makeAutoObservable(this, {}, { autoBind: true });

    this.clientSearchManager = new SearchManager(this, "CLIENT");
    this.residentSearchManager = new SearchManager(this, "RESIDENT");

    // update the searchTypeOverride on tenant change
    reaction(
      () => [this.workflowsStore.rootStore.currentTenantId],
      () => {
        this.setSearchTypeOverride(undefined);
      },
    );

    // mirror impersonation selected search with firestore
    reaction(
      () => this.workflowsStore.user?.updates?.selectedSearchIds,
      (searchIds?) =>
        (this.selectedSearchIdsForImpersonation = searchIds ?? []),
    );

    // clear saved search when changing tenants, to prevent cross-contamination
    reaction(
      () => [this.workflowsStore.rootStore.currentTenantId],
      () => {
        this.updateSelectedSearch([]);
      },
    );
  }

  get caseloadPersons(): JusticeInvolvedPerson[] {
    return [
      ...this.residentSearchManager.matchingPersons,
      ...this.clientSearchManager.matchingPersons,
    ];
  }

  get caseloadPersonsSorted(): JusticeInvolvedPerson[] {
    return [
      ...this.residentSearchManager.matchingPersonsSorted,
      ...this.clientSearchManager.matchingPersonsSorted,
    ];
  }

  get caseloadPersonsGrouped(): Record<string, JusticeInvolvedPerson[]> {
    return {
      ...this.clientSearchManager.matchingPersonsGrouped,
      ...this.residentSearchManager.matchingPersonsGrouped,
    };
  }

  get searchType(): SearchType {
    if (this.searchTypeOverride) return this.searchTypeOverride;
    const systemConfig = this.workflowsStore.activeSystemConfig;

    if (
      !systemConfig ||
      systemConfig.search.length > 1 ||
      this.workflowsStore.activeSystem === "ALL"
    )
      return "ALL";
    return systemConfig.search[0].searchType;
  }

  get selectedSearchIds(): string[] {
    const user = this.workflowsStore.user;
    if (!user) return [];

    const { info } = user;

    // return the current user's caseload and staff if current user
    // has at least one staff member they supervise upon login, otherwise
    // use the list updated in `selectedSearchIdsForSupervisorsWithStaff`
    if (this.hasSupervisedStaffAndRequiredFeatureVariant) {
      if (this.selectedSearchIdsForSupervisorsWithStaff) {
        return this.selectedSearchIdsForSupervisorsWithStaff;
      }
      const supervisedStaffIds =
        this.workflowsStore.staffSupervisedByCurrentUser.map(
          (staff) => staff.id,
        );

      const currentUserId = info.hasCaseload ? [info.id] : [];
      const staffAndCurrentUserIds = [...currentUserId, ...supervisedStaffIds];
      return staffAndCurrentUserIds;
    }

    if (this.workflowsStore.rootStore.isImpersonating) {
      return this.selectedSearchIdsForImpersonation ?? [];
    }

    const previousSearchIds = user.updates?.selectedSearchIds;
    return previousSearchIds ?? [];
  }

  updateSelectedSearch(searchIds: string[]): void {
    const user = this.workflowsStore.user;
    if (!user || !this.workflowsStore.rootStore.currentTenantId) return;

    this.workflowsStore.rootStore.firestoreStore.updateSelectedSearchIds(
      user.info.email,
      this.workflowsStore.rootStore.currentTenantId,
      searchIds,
    );

    // update the `selectedSearchIdsForSupervisorsWithStaff` for users with staff they supervise
    if (this.hasSupervisedStaffAndRequiredFeatureVariant) {
      this.selectedSearchIdsForSupervisorsWithStaff = searchIds;
    }

    this.selectedSearchIdsForImpersonation = searchIds;
  }

  get availableSearchables(): SearchableGroup[] {
    switch (this.searchType) {
      case "LOCATION": {
        return [
          {
            groupLabel: "All Locations",
            searchables: this.workflowsStore.availableLocations.map(
              (location) => new Location(location),
            ),
          },
        ];
      }
      case "INCARCERATION_OFFICER":
      case "OFFICER": {
        if (this.hasSupervisedStaffAndRequiredFeatureVariant) {
          const staffWithCaseload =
            this.workflowsStore.staffSupervisedByCurrentUser.map(
              (officer) => new Officer(officer),
            );
          // include user's own caseload if they have one
          if (this.workflowsStore.user?.info.hasCaseload) {
            const currentUserStaffRecord =
              this.workflowsStore.availableOfficers.find(
                (officer) => officer.id === this.workflowsStore.user?.info.id,
              );
            if (currentUserStaffRecord) {
              staffWithCaseload.push(new Officer(currentUserStaffRecord));
            }
          }
          const staffWithCaseloadIdsSet = new Set(
            staffWithCaseload.map((officer) => officer.searchId),
          );
          const groupedOfficers = [
            {
              groupLabel: "Your Team",
              searchables: staffWithCaseload,
            },
            {
              groupLabel: "All Staff",
              searchables: this.workflowsStore.availableOfficers
                .filter(
                  (officer) =>
                    !staffWithCaseloadIdsSet.has(officer.id) &&
                    officer.id !== this.workflowsStore.user?.info.id,
                )
                .map((officer) => new Officer(officer)),
            },
          ];

          return groupedOfficers;
        }

        return [
          {
            groupLabel: "All Officers",
            searchables: this.workflowsStore.availableOfficers.map(
              (officer) => new Officer(officer),
            ),
          },
        ];
      }
      case "CASELOAD": {
        return [
          {
            groupLabel: "All Caseloads",
            searchables: this.workflowsStore.availableOfficers.map(
              (officer) => new CaseloadSearchable(officer),
            ),
          },
        ];
      }
      case "ALL": {
        const locations = this.workflowsStore.availableLocations.map(
          (location) => new Location(location),
        );
        const officers = this.workflowsStore.availableOfficers.map(
          (officer) => new Officer(officer),
        );

        return [
          { groupLabel: "All Locations", searchables: locations },
          { groupLabel: "All Officers", searchables: officers },
        ].filter((group) => group.searchables.length); // exclude groups with 0 searchables
      }
      case undefined:
        return [];
      default:
        assertNever(this.searchType);
    }
  }

  get hasSupervisedStaffAndRequiredFeatureVariant(): boolean {
    return Boolean(
      this.workflowsStore.featureVariants.workflowsSupervisorSearch &&
        this.workflowsStore.staffSupervisedByCurrentUser.length > 0,
    );
  }

  setSearchTypeOverride(override?: SearchType): void {
    this.searchTypeOverride = override;
  }

  /**
   * Title to display for the search bar in workflows
   */
  get workflowsSearchFieldTitle(): string {
    return this.searchTitleOverride(
      this.workflowsStore.activeSystem,
      "officer",
    );
  }

  searchTitleOverride(
    system: SystemId | undefined,
    defaultTitle: string,
    // include an optional callback in case additional logic needs to be applied
    callbackFn: (title: string) => string = (title) => title,
  ): string {
    if (!system || system === "ALL") return callbackFn(defaultTitle);
    const searchConfig = this.workflowsStore.systemConfigFor(system).search;

    // If there is a search type override (a search pill is selected),
    // find the associated search config and return that title
    if (this.searchTypeOverride) {
      const selectedSearchConfig = searchConfig.find(
        (search) => search.searchType === this.searchTypeOverride,
      );
      if (selectedSearchConfig)
        return callbackFn(selectedSearchConfig.searchTitle);
    }

    // If there is a single search config for the current system, return that title,
    if (searchConfig.length === 1 && searchConfig[0].searchTitle)
      return callbackFn(searchConfig[0].searchTitle);

    // otherwise return the defaultTitle
    return callbackFn(defaultTitle);
  }

  handleSearchPillClick(searchType: SearchType, system: SystemId): void {
    const { activeSystem, activePage, updateActiveSystem } =
      this.workflowsStore;
    // Updating the active system and searchTypeOverride narrows down the
    // availableSearchables to match the selected search pill
    activeSystem !== "ALL" && activePage.page === "home"
      ? updateActiveSystem("ALL")
      : updateActiveSystem(system);

    this.searchTypeOverride
      ? this.setSearchTypeOverride(undefined)
      : this.setSearchTypeOverride(searchType);
  }
}
