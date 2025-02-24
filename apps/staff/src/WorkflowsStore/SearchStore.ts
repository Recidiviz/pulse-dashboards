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

import { makeAutoObservable, reaction } from "mobx";

import { SearchType, SystemId } from "../core/models/types";
import { SearchManager } from "./SearchManager";
import { JusticeInvolvedPerson } from "./types";
import { WorkflowsStore } from "./WorkflowsStore";

export class SearchStore {
  workflowsStore: WorkflowsStore;

  clientSearchManager: SearchManager;

  residentSearchManager: SearchManager;

  searchTypeOverride?: SearchType;

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

  setSearchTypeOverride(override?: SearchType): void {
    this.searchTypeOverride = override;
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
