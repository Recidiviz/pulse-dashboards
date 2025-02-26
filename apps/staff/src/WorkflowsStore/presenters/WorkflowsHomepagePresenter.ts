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

import pluralize from "pluralize";

import { OpportunityConfigurationStore } from "../Opportunity/OpportunityConfigurations/OpportunityConfigurationStore";
import { WorkflowsStore } from "../WorkflowsStore";
import { CaseloadOpportunitiesPresenter } from "./CaseloadOpportunitiesPresenter";

export class WorkflowsHomepagePresenter extends CaseloadOpportunitiesPresenter {
  constructor(
    workflowsStore: WorkflowsStore,
    private opportunityConfigurationStore: OpportunityConfigurationStore,
  ) {
    super(workflowsStore);
  }

  private get listOfSelectedOpportunitiesText() {
    const { opportunities } = this.opportunityConfigurationStore;

    const labels = this.activeOpportunityTypes
      .slice(0, 2)
      .map((ot) => opportunities[ot].label);
    return labels.join(" and ");
  }

  private get searchResultLabel() {
    const {
      activeSystem,
      searchStore: { selectedSearchIds, searchTypeOverride },
    } = this.workflowsStore;

    const searchIdsCount = selectedSearchIds.length;

    const replaceOfficerTitleCallback = (value: string) => {
      return [
        "case manager",
        "officer",
        "agent",
        "supervision officer",
      ].includes(value)
        ? "caseload"
        : value;
    };
    const incarcerationSearchOverride =
      this.workflowsStore.searchStore.searchTitleOverride(
        "INCARCERATION",
        "location",
        replaceOfficerTitleCallback,
      );
    const activeSystemSearchOverride =
      this.workflowsStore.searchStore.searchTitleOverride(
        activeSystem,
        "caseload",
        replaceOfficerTitleCallback,
      );

    return activeSystem === "ALL" &&
      !searchTypeOverride &&
      incarcerationSearchOverride !== "caseload"
      ? `${pluralize("caseload", searchIdsCount)} and/or ${pluralize(incarcerationSearchOverride, searchIdsCount)}`
      : pluralize(activeSystemSearchOverride, searchIdsCount);
  }

  get userGivenNames() {
    return this.workflowsStore.user?.info.givenNames;
  }

  get labels() {
    return {
      ...super.labels,
      searchResultLabel: this.searchResultLabel,
      listOfSelectedOpportunities: this.listOfSelectedOpportunitiesText,
    };
  }

  get supportsMultipleSystems() {
    return this.workflowsStore.supportsMultipleSystems;
  }
}
