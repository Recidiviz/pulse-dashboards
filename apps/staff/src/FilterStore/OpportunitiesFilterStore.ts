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

import { makeObservable } from "mobx";

import {
  FilterField,
  FilterOption,
  WorkflowsOpportunityFilterConfig,
} from "../core/models/types";
import AnalyticsStore from "../RootStore/AnalyticsStore";
import TenantStore from "../RootStore/TenantStore";
import { WorkflowsStore } from "../WorkflowsStore";
import {
  Opportunity,
  OpportunityTabGroup,
} from "../WorkflowsStore/Opportunity";
import { opportunityEligibilityDateComparator } from "../WorkflowsStore/Opportunity/utils/dateUtils";
import { JusticeInvolvedPerson } from "../WorkflowsStore/types";
import FilterStoreBase from "./FilterStoreBase";

export default class OpportunitiesFilterStore extends FilterStoreBase {
  constructor(
    protected readonly analyticsStore: AnalyticsStore,
    readonly tenantStore: TenantStore,
    protected readonly workflowsStore: WorkflowsStore,
  ) {
    super(analyticsStore, tenantStore, workflowsStore);
    makeObservable<OpportunitiesFilterStore>(this, {
      // Observables (superclass and this class)
      _selectedFilters: true,

      // Computed
      filterConfig: false,
      filters: false,

      // Actions
      clearFilters: true,
      selectAllFilters: true,
      unsetFilter: true,
      setFilter: true,
      toggleFilter: true,
      opportunityMatchesFilters: true,
      orderedOpportunitiesForCategory: true,
      countForOpportunityCategory: true,
      filteredOpportunities: true,
      trackFiltersReset: true,
      trackFilterChanged: true,
      trackOpportunityFilterDropdownOpened: true,
    });
  }

  get filterConfig(): WorkflowsOpportunityFilterConfig {
    const { workflowsOpportunityFilterConfig } =
      this.tenantStore;

    return workflowsOpportunityFilterConfig || {
      filters: [],
    }
  }

  clearFilters = () => {
    this._selectedFilters = {};

    this.analyticsStore.trackOpportunityFiltersCleared();
  };

  // Opportunities Specific Filters

  opportunityMatchesFilters(opportunity: Opportunity): boolean {
    const filtersForType = Object.entries(
      this.selectedFiltersForType("opportunity"),
    );

    const matchesOpportunityFilters = filtersForType.every(
      ([field, options]) =>
        opportunity.record?.caseNotes[field] &&
        options &&
        options.includes(opportunity.record?.caseNotes[field][0].noteTitle),
    );

    return matchesOpportunityFilters;
  }

  orderedOpportunitiesForCategory(
    category: OpportunityTabGroup,
    peopleInActiveTab: Opportunity<JusticeInvolvedPerson>[],
  ): Opportunity[] {
    return this.allOpportunitiesForCategory(category, peopleInActiveTab).sort(
      opportunityEligibilityDateComparator,
    );
  }

  countForOpportunityCategory(
    category: OpportunityTabGroup,
    peopleInActiveTab: Opportunity<JusticeInvolvedPerson>[],
  ): number {
    return this.orderedOpportunitiesForCategory(category, peopleInActiveTab)
      .length;
  }

  allOpportunitiesForCategory(
    category: OpportunityTabGroup,
    peopleInActiveTab: Opportunity<JusticeInvolvedPerson>[],
    applyFilter = true,
  ): Opportunity[] {
    // If applyFilter is true, only return people that match the currently selected filters
    // If applyFilter is false, return all people (regardless of filters)
    const people = applyFilter
      ? this.filteredOpportunities(peopleInActiveTab)
      : peopleInActiveTab;

    return people.filter((person) => {
      if (applyFilter && !this.opportunityMatchesFilters(person)) return false;

      switch (category) {
        case "ELIGIBILITY STATUS":
          return true;
        default:
          return false;
      }
    });
  }

  filteredOpportunities(
    peopleInActiveTab: Opportunity<JusticeInvolvedPerson>[],
  ): Opportunity<JusticeInvolvedPerson>[] {
    return peopleInActiveTab.filter((opps) =>
      this.opportunityMatchesFilters(opps),
    );
  }

  trackFiltersReset = () => {
    this.analyticsStore.trackOpportunityFiltersReset({
      selectedFiltersBeforeReset: this._selectedFilters,
    });
  };

  trackFilterChanged = (
    field: FilterField,
    option: FilterOption,
    changedFilterSelected?: boolean,
    onlyClicked?: boolean,
  ) => {
    this.analyticsStore.trackOpportunityFilterChanged({
      changedFilterCategory: field,
      changedFilterValue: option.value,
      changedFilterSelected: !!changedFilterSelected,
      selectedFilters: this._selectedFilters,
      onlyClicked: !!onlyClicked,
    });
  };

  trackOpportunityFilterDropdownOpened() {
    this.analyticsStore.trackOpportunityFilterDropdownOpened();
  }
}
