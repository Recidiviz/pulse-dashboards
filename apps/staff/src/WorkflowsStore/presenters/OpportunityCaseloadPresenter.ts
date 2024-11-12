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

import { toTitleCase } from "@artsy/to-title-case";
import { arrayMove } from "@dnd-kit/sortable";
import { difference, intersection } from "lodash";
import { makeAutoObservable } from "mobx";
import toast from "react-hot-toast";

import { OpportunityType } from "~datatypes";

import { workflowsUrl } from "../../core/views";
import FirestoreStore, { UserUpdateRecord } from "../../FirestoreStore";
import { SupervisionOpportunityPresenter } from "../../InsightsStore/presenters/SupervisionOpportunityPresenter";
import AnalyticsStore from "../../RootStore/AnalyticsStore";
import { FeatureVariantRecord } from "../../RootStore/types";
import {
  opportunitiesBySubcategory,
  opportunitiesByTab,
} from "../../WorkflowsStore/utils";
import {
  Opportunity,
  OpportunityTab,
  OpportunityTabGroup,
} from "../Opportunity";
import { OpportunityConfiguration } from "../Opportunity/OpportunityConfigurations";
import { CollectionDocumentSubscription } from "../subscriptions";
import { WorkflowsStore } from "../WorkflowsStore";
/**
 * Responsible for presenting information about the caseload relative to a user's
 * current view of a single opportunity, including who is eligible and the user's
 * visual settings such as tab grouping and tab ordering.
 */
export class OpportunityCaseloadPresenter {
  readonly displayTabGroups: OpportunityTabGroup[];
  private readonly sortingEnabled: boolean;
  private _activeTabGroup: OpportunityTabGroup;
  private userSelectedTab?: OpportunityTab;
  private userOrderedTabs?: OpportunityTab[];
  private readonly updatesSubscription?: CollectionDocumentSubscription<UserUpdateRecord>;

  constructor(
    private readonly analyticsStore: AnalyticsStore,
    private readonly firestoreStore: FirestoreStore,
    private readonly workflowsStore: WorkflowsStore,
    public readonly config: OpportunityConfiguration,
    featureVariants: FeatureVariantRecord,
    public readonly opportunityType: OpportunityType,
    private readonly supervisionPresenter?: SupervisionOpportunityPresenter,
  ) {
    this.displayTabGroups = Object.keys(
      config.tabGroups,
    ) as OpportunityTabGroup[];
    this._activeTabGroup = this.displayTabGroups[0];
    this.userSelectedTab = this.defaultOrderedTabs[0];
    this.userOrderedTabs = undefined;

    this.updatesSubscription = this.workflowsStore.userUpdatesSubscription;

    this.sortingEnabled = !!featureVariants.sortableOpportunityTabs;

    makeAutoObservable(this);
  }

  get activeTab() {
    // The currently active tab is either the user's selection or the default tab.
    // We switch to the default tab when the user has not clicked anything or
    // when the user-selected tab is no longer displayed (either when the user
    // switches tab groups, or when the current tab group disallows showing empty
    // tabs and the user-selected tab becomes empty upon removing a search item)
    return this.userSelectedTab &&
      this.displayTabs.includes(this.userSelectedTab)
      ? this.userSelectedTab
      : this.defaultTab;
  }

  set activeTab(newTab: OpportunityTab) {
    this.userSelectedTab = newTab;
    this.analyticsStore.trackOpportunityTabClicked({ tab: newTab });
  }

  get displayTabs() {
    if (this.shouldShowAllTabs) {
      // Keep track of the user's selection locally to avoid
      // flickering when waiting for the user's tab preference to update in firestore
      return this.userOrderedTabs || this.defaultOrderedTabs;
    } else {
      return this.unorderedTabs;
    }
  }

  set displayTabs(newTabOrder: OpportunityTab[]) {
    this.userOrderedTabs = newTabOrder;
    if (this.shouldShowAllTabs) {
      this.firestoreStore
        .updateCustomTabOrderings(
          this.workflowsStore.currentUserEmail,
          this.opportunityType,
          this.activeTabGroup,
          newTabOrder,
        )
        .then(() => {
          toast(`New tab ordering has been saved for ${this.config.label}`, {
            id: "newTabOrderingToast", // prevent duplicate toasts
            position: "bottom-left",
          });

          this.analyticsStore.trackOpportunityTabOrderChanged({
            tabOrder: newTabOrder,
            opportunityType: this.opportunityType,
          });
        })
        .catch((e: Error) => {
          toast("Failed to save new tab ordering: " + e.message, {
            position: "bottom-left",
          });
        });
    }
  }

  get activeTabGroup() {
    return this._activeTabGroup;
  }

  set activeTabGroup(newTabGroup: OpportunityTabGroup) {
    if (newTabGroup !== this._activeTabGroup) {
      this._activeTabGroup = newTabGroup;
      // The user's tab order preference may have changed based on this new tab group
      this.userOrderedTabs = undefined;
    }
  }

  private get defaultTab() {
    return this.displayTabs[0];
  }

  private get defaultOrderedTabs(): OpportunityTab[] {
    const customOrder =
      this.updatesSubscription?.data?.customTabOrderings?.[
        this.opportunityType
      ]?.[this.activeTabGroup] ?? [];
    const configOrder = this.config.tabGroups[this.activeTabGroup] ?? [];
    return [
      // Only list tabs that are included in the config
      // First list tabs that exist in the custom order
      ...intersection(customOrder, configOrder),
      // Then list those that don't
      ...difference(configOrder, customOrder),
    ];
  }

  private get unorderedTabs(): OpportunityTab[] {
    // Only display tabs in the active tab group that correspond to relevant
    // opportunities
    const tabs = this.oppsFromOpportunitiesByTab
      ? (intersection(
          this.config.tabGroups[this.activeTabGroup],
          Object.keys(this.oppsFromOpportunitiesByTab),
        ) as OpportunityTab[])
      : [];
    return tabs;
  }

  get shouldShowAllTabs() {
    return this.sortingEnabled && this.activeTabGroup === "ELIGIBILITY STATUS";
  }

  get activeOpportunityNotifications() {
    return this.workflowsStore.activeNotificationsForOpportunityType(
      this.opportunityType,
    );
  }

  /**
   * @return A map from tabs to the value to display on that tab's badge,
   * i.e. the number of people in that tab
   */
  get tabBadges(): Partial<Record<OpportunityTab, number>> {
    const badges: Partial<Record<OpportunityTab, number>> = {};
    for (const tab of this.displayTabs) {
      badges[tab] = this.oppsFromOpportunitiesByTab?.[tab]?.length ?? 0;
    }
    return badges;
  }

  get oppsFromOpportunitiesByTab():
    | Record<OpportunityTab, Opportunity[]>
    | undefined {
    const opps =
      this.supervisionPresenter?.opportunitiesByType ??
      this.workflowsStore.allOpportunitiesByType;
    return opportunitiesByTab(opps, this.activeTabGroup)[this.opportunityType];
  }

  get label() {
    return this.config.label;
  }

  get callToAction() {
    return this.config.callToAction;
  }

  get subheading() {
    return this.config.subheading;
  }

  get peopleInActiveTab() {
    return this.oppsFromOpportunitiesByTab?.[this.activeTab] ?? [];
  }

  get peopleInActiveTabBySubcategory() {
    return opportunitiesBySubcategory(this.peopleInActiveTab);
  }

  get subcategoryOrder(): string[] | undefined {
    const peopleBySubcategory = this.peopleInActiveTabBySubcategory;
    if (!peopleBySubcategory) return undefined;

    // Respect any order defined in the configuration if one exists
    return (
      this.config.subcategoryOrderings?.[this.activeTab] ??
      Object.keys(peopleBySubcategory)
    );
  }

  headingText(subcategory: string) {
    return this.config.subcategoryHeadings?.[subcategory];
  }

  get justiceInvolvedPersonTitle() {
    if (this.supervisionPresenter) {
      return this.supervisionPresenter.labels.supervisionJiiLabel;
    } else {
      return this.workflowsStore.justiceInvolvedPersonTitle;
    }
  }

  get emptyTabText() {
    if (this.activeTab) {
      return (
        this.config.emptyTabCopy[this.activeTab] ??
        `At this time, there are no ${this.justiceInvolvedPersonTitle}s who are ${this.activeTab}. Please navigate to one of the other tabs.`
      );
    }
    // When we don't have an active tab, there are no people in our current tab group
    return `Please select a different grouping. None of the ${this.justiceInvolvedPersonTitle}s were able to be grouped by ${toTitleCase(this.activeTabGroup.toLowerCase())}.`;
  }

  get tabPrefaceText(): string | undefined {
    if (this.activeTab) {
      return this.config.tabPrefaceCopy[this.activeTab];
    }
  }

  get selectedPerson() {
    // TODO(#5965): Look into isolating the selected person from the workflows store
    if (this.supervisionPresenter) {
      // Pull the selected client from the presenter's hydrated list of clients
      // so that we can access the relevant hydrated opportunity when selected.
      return this.supervisionPresenter.clients?.find(
        (client) =>
          client.pseudonymizedId ===
          this.workflowsStore.selectedPerson?.pseudonymizedId,
      );
    } else {
      return this.workflowsStore.selectedPerson;
    }
  }

  get selectedOpportunity() {
    return this.selectedPerson?.opportunities[this.opportunityType]?.find(
      (opp) => opp.selectId === this.workflowsStore.selectedOpportunityId,
    );
  }

  get overdueOpportunityUrl(): string | undefined {
    if (!this.config.linkedOverdueOpportunityType) return;
    const urlSection =
      this.workflowsStore.opportunityConfigurationStore.opportunities[
        this.config.linkedOverdueOpportunityType
      ].urlSection;
    return workflowsUrl("opportunityClients", { urlSection });
  }

  get overdueOpportunityCount(): number {
    const { linkedOverdueOpportunityType } = this.config;
    if (!linkedOverdueOpportunityType) return 0;

    return (
      this.workflowsStore.eligibleOpportunities[linkedOverdueOpportunityType]
        ?.length || 0
    );
  }

  get overdueOpportunityCalloutCopy() {
    return this.config.overdueOpportunityCalloutCopy;
  }

  dismissNotification(id: string) {
    this.workflowsStore.dismissOpportunityNotification(id);
  }

  swapTabs(dragged: OpportunityTab, newLocation: OpportunityTab) {
    const oldIndex = this.displayTabs.indexOf(dragged);
    const newIndex = this.displayTabs.indexOf(newLocation);
    const newTabs = arrayMove(this.displayTabs, oldIndex, newIndex);
    this.displayTabs = newTabs;
  }
}
