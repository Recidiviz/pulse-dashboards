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

import {
  compositeHydrationState,
  Hydratable,
  HydrationState,
  isHydrated,
} from "~hydration-utils";

import { Client } from "../Client";
import { OpportunityConfigurationStore } from "../Opportunity/OpportunityConfigurations/OpportunityConfigurationStore";
import { WorkflowsStore } from "../WorkflowsStore";
import { CaseloadOpportunitiesPresenter } from "./CaseloadOpportunitiesPresenter";

enum HomepageSpot {
  TOP,
  BOTTOM,
  CARD,
}

export class WorkflowsHomepagePresenter extends CaseloadOpportunitiesPresenter {
  constructor(
    workflowsStore: WorkflowsStore,
    private opportunityConfigurationStore: OpportunityConfigurationStore,
  ) {
    super(workflowsStore);
  }

  get shouldHydrateTasks() {
    // Only hydrate tasks when we are in supervision and the user has access to supervision tasks
    return (
      this.workflowsStore.activeSystem !== "INCARCERATION" &&
      this.workflowsStore.rootStore.userStore.canUserAccessTasks
    );
  }

  hydrate() {
    // Hydrate opportunities
    super.hydrate();

    // Possibly hydrate tasks
    if (this.shouldHydrateTasks) {
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

  get hydrationState(): HydrationState {
    if (this.isDebug) {
      return { status: "hydrated" };
    }

    const opportunityHydrators = [this.workflowsStore as Hydratable].concat(
      this.workflowsStore.caseloadPersons
        .map((person) => person.opportunityManager)
        .concat(),
    );

    if (this.shouldHydrateTasks) {
      // If tasks are available, take into account tasks in the hydration state,
      // so that we continue hydration until both tasks and opportunities are hydrated
      const taskHydrators = this.workflowsStore.caseloadPersons
        .flatMap((person) =>
          person.supervisionTasks ? [person.supervisionTasks] : [],
        )
        .concat();
      return compositeHydrationState(
        opportunityHydrators.concat(taskHydrators),
      );
    } else {
      return compositeHydrationState(opportunityHydrators);
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

  /**
   * Return true if tasks should be shown on the homepage in some form.
   */
  get showTasksSummary() {
    const { currentTenantConfig } = this.workflowsStore.rootStore.tenantStore;
    return (
      // tasks exists for this tenant, and
      !!currentTenantConfig?.navigation?.workflows?.includes("tasks") &&
      // the current caseload has tasks available, and
      this.workflowsStore.hasSupervisionTasks &&
      // the current user has access to tasks
      this.workflowsStore.rootStore.userStore.canUserAccessTasks
    );
  }

  /**
   * Return location of the tasks on the workflows homepage relative to the opportunity summaries
   */
  get tasksSummaryLocation(): HomepageSpot {
    if (
      this.workflowsStore.rootStore.userStore.activeFeatureVariants
        .tasksRoutePlanner
    ) {
      return HomepageSpot.CARD;
    } else if (this.workflowsStore.rootStore.currentTenantId === "US_TX") {
      // TODO(#9369) When Tasks Route Planner is fully launched in Texas, we can remove
      // this case
      return HomepageSpot.TOP;
    } else {
      return HomepageSpot.BOTTOM;
    }
  }

  get showTasksSummaryTop() {
    return (
      this.showTasksSummary && this.tasksSummaryLocation === HomepageSpot.TOP
    );
  }
  get showTasksSummaryBottom() {
    return (
      this.showTasksSummary && this.tasksSummaryLocation === HomepageSpot.BOTTOM
    );
  }
  get showTasksSummaryCard() {
    return (
      this.showTasksSummary && this.tasksSummaryLocation === HomepageSpot.CARD
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
