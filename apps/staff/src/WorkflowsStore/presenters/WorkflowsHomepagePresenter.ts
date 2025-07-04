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

import { isEmpty } from "lodash";
import pluralize from "pluralize";
import simplur from "simplur";

import { isHydrated } from "~hydration-utils";

import { Client } from "../Client";
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

  hydrate() {
    // Hydrate opportunities
    super.hydrate();

    // Only hydrate tasks when we are in supervision and the user has access to supervision tasks
    if (
      this.workflowsStore.activeSystem !== "INCARCERATION" &&
      this.workflowsStore.rootStore.userStore.canUserAccessTasks
    ) {
      this.workflowsStore.caseloadPersons.forEach((person) => {
        // it's possible that caseloadPersons is a mix of clients and residents
        // when multiple caseloads from different system types are selected
        if (
          person instanceof Client &&
          person.supervisionTasks &&
          !isHydrated(person.supervisionTasks)
        ) {
          person.supervisionTasks.hydrate();
        }
      });
    }
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
      workflowsSearchFieldTitle:
        this.workflowsStore.searchStore.workflowsSearchFieldTitle,
    };
  }

  get supportsMultipleSystems() {
    return this.workflowsStore.supportsMultipleSystems;
  }

  get showTasksSummary() {
    return (
      this.workflowsStore.isSupervisionTasksConfigured &&
      this.workflowsStore.hasSupervisionTasks &&
      this.workflowsStore.rootStore.userStore.canUserAccessTasks
    );
  }

  get tasks() {
    return this.workflowsStore.supervisionTasks;
  }

  get ctaAndHeaderText(): { ctaText?: string; headerText?: string } {
    const {
      workflowsSearchFieldTitle,
      justiceInvolvedPersonTitle,
      listOfSelectedOpportunities,
      searchResultLabel,
    } = this.labels;

    const selectedSearchIdsCount = this.selectedSearchIds?.length || 0;

    // If the user has access to tasks, check whether there are any tasks
    // in addition to checking whether there are any opportunities
    const noOpportunities =
      isEmpty(this.opportunitiesByType) ||
      Object.values(this.opportunitiesByType || {}).every((opps) =>
        isEmpty(opps),
      );
    const noSearchResults = !this.showTasksSummary && noOpportunities;

    const salutation = this.userGivenNames
      ? `Hi, ${this.userGivenNames}.`
      : "Hi.";
    // If no search ids are selected, show a welcome message
    if (selectedSearchIdsCount === 0)
      return {
        headerText: salutation,
        ctaText: this.supportsMultipleSystems
          ? `Search above to review and refer people eligible for opportunities like ${listOfSelectedOpportunities}.`
          : `Search for ${pluralize(
              workflowsSearchFieldTitle,
            )} above to review and refer eligible ${justiceInvolvedPersonTitle}s for
                opportunities like ${listOfSelectedOpportunities}.`,
      };
    // Else if no opportunities are found, show a call to action to select another search id
    else if (noSearchResults)
      return {
        ctaText:
          this.supportsMultipleSystems ||
          workflowsSearchFieldTitle === "caseload"
            ? "None of the selected caseloads are eligible for opportunities. Search for another caseload."
            : simplur`None of the ${justiceInvolvedPersonTitle}s on the selected ${[
                selectedSearchIdsCount,
              ]} ${pluralize(
                workflowsSearchFieldTitle,
                selectedSearchIdsCount,
              )}['s|'] caseloads are eligible for opportunities. Search for another ${workflowsSearchFieldTitle}.`,
      };
    // else show the header text with the number of opportunities found
    else
      return {
        headerText: `${salutation} We’ve found some outstanding items across ${selectedSearchIdsCount} ${searchResultLabel}`,
      };
  }
}
