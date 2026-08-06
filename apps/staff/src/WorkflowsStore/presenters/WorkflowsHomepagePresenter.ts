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

import { SystemId } from "~datatypes";
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

  // Resolves the human-facing noun to describe search hits for a given
  // system, defaulting to a fallback when the tenant has no titles configured
  // for that system. Officer-shaped titles get swapped for "caseload" — same
  // callback semantics the old SearchStore.searchTitleOverride had, inlined
  // here since this is the only consumer that still needs it.
  private titleForSystem(
    system: SystemId | undefined,
    fallback: string,
  ): string {
    if (!system || system === "ALL") return fallback;
    const { searchTypeOverride } = this.workflowsStore.searchStore;
    const search = this.workflowsStore.systemConfigFor(system).search;

    let resolved = fallback;
    if (searchTypeOverride) {
      const selected = search.find((s) => s.searchType === searchTypeOverride);
      if (selected) resolved = selected.searchTitle;
    } else if (search.length === 1 && search[0].searchTitle) {
      resolved = search[0].searchTitle;
    }

    return ["case manager", "officer", "agent", "supervision officer"].includes(
      resolved,
    )
      ? "caseload"
      : resolved;
  }

  private get searchResultLabel() {
    const {
      activeSystem,
      searchStore: { selectedSearchIds, searchTypeOverride },
    } = this.workflowsStore;

    const searchIdsCount = selectedSearchIds.length;
    const incarcerationTitle = this.titleForSystem("INCARCERATION", "location");
    const activeSystemTitle = this.titleForSystem(activeSystem, "caseload");

    return activeSystem === "ALL" &&
      !searchTypeOverride &&
      incarcerationTitle !== "caseload"
      ? `${pluralize("caseload", searchIdsCount)} and/or ${pluralize(incarcerationTitle, searchIdsCount)}`
      : pluralize(activeSystemTitle, searchIdsCount);
  }

  get userGivenNames() {
    return this.workflowsStore.user?.info.givenNames;
  }

  get isTypesenseSearchEnabled(): boolean {
    return this.workflowsStore.searchStore.isTypesenseSearchEnabled;
  }

  get isCaseloadLoaded(): boolean {
    return this.workflowsStore.caseloadLoaded();
  }

  get welcomeCtaAndHeaderText(): { ctaText: string; headerText: string } {
    const { workflowsSearchFieldTitle, listOfSelectedOpportunities } =
      this.labels;
    const salutation = this.userGivenNames
      ? `Hi, ${this.userGivenNames}.`
      : "Hi.";
    const ctaText =
      this.isTypesenseSearchEnabled && workflowsSearchFieldTitle
        ? `Start typing the name of ${workflowsSearchFieldTitle} above to review and refer people eligible for opportunities like ${listOfSelectedOpportunities}.`
        : `Search above to review and refer people eligible for opportunities like ${listOfSelectedOpportunities}.`;
    return { headerText: salutation, ctaText };
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
    } else {
      return HomepageSpot.BOTTOM;
    }
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
    const { searchResultLabel } = this.labels;

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
    // If no search ids are selected, show a welcome message.
    if (selectedSearchIdsCount === 0) {
      return this.welcomeCtaAndHeaderText;
    }

    const noResultsCta =
      "None of the selected caseloads have eligible opportunities. Search for another caseload.";
    const foundItems = `We’ve found some outstanding items across ${selectedSearchIdsCount} ${searchResultLabel}`;

    // Without the FV, keep the original single-header styling: the "no results"
    // copy is a lone CTA and the "found items" copy is one Serif header line.
    if (!this.isTypesenseSearchEnabled) {
      return noSearchResults
        ? { ctaText: noResultsCta }
        : { headerText: `${salutation} ${foundItems}` };
    }

    // With the FV, the salutation is the header and the detail renders on the
    // line below it (styled like the welcome copy's CTA).
    return noSearchResults
      ? { headerText: salutation, ctaText: noResultsCta }
      : { headerText: salutation, ctaText: `${foundItems}.` };
  }

  // Copy for the header rendered above the search bar (typesense search FV):
  // the welcome greeting until the selected caseload's results are ready, then
  // the found / no-results copy. Empty when the FV is off (the copy renders
  // below the search bar instead — see `workflowsResultCopy`).
  get aboveHeaderCopy(): { headerText?: string; callToActionText?: string } {
    if (!this.isTypesenseSearchEnabled) return {};

    const resultsReady =
      this.selectedSearchIds.length > 0 &&
      this.isCaseloadLoaded &&
      isHydrated(this);

    const { headerText, ctaText } = resultsReady
      ? this.ctaAndHeaderText
      : this.welcomeCtaAndHeaderText;

    return { headerText, callToActionText: ctaText };
  }

  // Copy for the WorkflowsResults header below the search bar. Empty when the
  // typesense search FV moves the copy above the search bar.
  get workflowsResultCopy(): {
    headerText?: string;
    callToActionText?: string;
  } {
    if (this.isTypesenseSearchEnabled) return {};

    const { headerText, ctaText } = this.ctaAndHeaderText;
    return { headerText, callToActionText: ctaText };
  }
}
