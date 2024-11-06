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

import TENANTS from "../../tenants";
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
      workflowsSearchFieldTitle,
      activeSystem,
      rootStore: { currentTenantId },
      selectedSearchIds,
    } = this.workflowsStore;

    const searchIdsCount = selectedSearchIds.length;
    if (
      activeSystem === "INCARCERATION" &&
      workflowsSearchFieldTitle !== "case manager"
    ) {
      return pluralize(workflowsSearchFieldTitle, searchIdsCount);
    }
    const tenantConfig =
      currentTenantId &&
      TENANTS[currentTenantId]?.workflowsSystemConfigs?.INCARCERATION;

    const facilitiesSearchOverride =
      tenantConfig?.searchTitleOverride ?? "location";

    return activeSystem === "ALL" && facilitiesSearchOverride !== "case manager"
      ? `${pluralize("caseload", searchIdsCount)} and/or ${pluralize(facilitiesSearchOverride, searchIdsCount)}`
      : pluralize("caseload", searchIdsCount);
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
