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

import { arrayMove } from "@dnd-kit/sortable";
import { differenceInDays, startOfToday } from "date-fns";
import { difference, intersection, some } from "lodash";
import { action, makeAutoObservable, reaction } from "mobx";
import toast from "react-hot-toast";

import { OpportunityType } from "~datatypes";

import { OpportunityTableColumnId } from "../../core/OpportunityCaseloadView/HydratedOpportunityPersonList";
import { insightsUrl, workflowsUrl } from "../../core/views";
import FirestoreStore, { UserUpdateRecord } from "../../FirestoreStore";
import { SupervisionOpportunityPresenter } from "../../InsightsStore/presenters/SupervisionOpportunityPresenter";
import AnalyticsStore from "../../RootStore/AnalyticsStore";
import TenantStore from "../../RootStore/TenantStore";
import { FeatureVariantRecord } from "../../RootStore/types";
import { toTitleCase } from "../../utils";
import {
  Opportunity,
  OpportunityTab,
  OpportunityTabGroup,
} from "../Opportunity";
import { OpportunityConfiguration } from "../Opportunity/OpportunityConfigurations";
import { CollectionDocumentSubscription } from "../subscriptions";
import { JusticeInvolvedPerson } from "../types";
import { opportunitiesBySubcategory, opportunitiesByTab } from "../utils";
import { WorkflowsStore } from "../WorkflowsStore";
import {
  TableViewSelectInterface,
  TableViewSelectPresenter,
} from "./TableViewSelectPresenter";

/**
 * Responsible for presenting information about the caseload relative to a user's
 * current view of a single opportunity, including who is eligible and the user's
 * visual settings such as tab grouping and tab ordering.
 */
export class OpportunityPersonListPresenter
  implements TableViewSelectInterface
{
  readonly isSupervisorHomepage: boolean;
  readonly displayTabGroups: OpportunityTabGroup[];
  readonly showZeroGrantsPill: boolean;
  private readonly tabSortingEnabled: boolean;
  readonly tableMultiSortEnabled: boolean;
  private _activeTabGroup: OpportunityTabGroup;
  private userSelectedTab?: OpportunityTab;
  private userOrderedTabs?: OpportunityTab[];
  private readonly updatesSubscription?: CollectionDocumentSubscription<UserUpdateRecord>;
  private tableViewSelectPresenter: TableViewSelectPresenter;

  private _navigablePeople: Opportunity<JusticeInvolvedPerson>[] = [];

  constructor(
    private readonly analyticsStore: AnalyticsStore,
    private readonly firestoreStore: FirestoreStore,
    private readonly tenantStore: TenantStore,
    private readonly workflowsStore: WorkflowsStore,
    public readonly config: OpportunityConfiguration,
    featureVariants: FeatureVariantRecord,
    public readonly opportunityType: OpportunityType,
    private readonly supervisionPresenter?: SupervisionOpportunityPresenter,
  ) {
    this.isSupervisorHomepage = !!supervisionPresenter;

    this.displayTabGroups = Object.keys(
      config.tabGroups,
    ) as OpportunityTabGroup[];
    this._activeTabGroup = this.displayTabGroups[0];
    this.userSelectedTab = undefined;
    this.userOrderedTabs = undefined;

    this.tableViewSelectPresenter = new TableViewSelectPresenter(
      firestoreStore,
      workflowsStore,
      featureVariants,
    );

    this.updatesSubscription = this.workflowsStore.userUpdatesSubscription;

    this.tabSortingEnabled = !!featureVariants.sortableOpportunityTabs;
    this.tableMultiSortEnabled = !!featureVariants.tableMultiSortEnabled;

    this.showZeroGrantsPill = !!(
      featureVariants.zeroGrantsFlag &&
      this.supervisionPresenter?.officerRecord?.zeroGrantOpportunities?.includes(
        opportunityType,
      )
    );

    // only update the list of opportunities to navigate through when necessary,
    // to avoid changing the list when an opportunity status is changed from side panel
    reaction(
      () => this.selectedOpportunity,
      (nextOpp) => {
        if (!nextOpp || !this._navigablePeople.includes(nextOpp))
          this.updateNavigablePeople();
      },
      // populate the list if there's already a selected person upon page load
      { fireImmediately: true },
    );

    makeAutoObservable(this, {
      updateNavigablePeople: action,
      handleOpportunityClick: action,
    });
  }

  get showListView() {
    return this.tableViewSelectPresenter.showListView;
  }

  set showListView(showListView: boolean) {
    this.analyticsStore.trackOpportunityTableViewPreferenceChanged({
      newViewType: showListView ? "list" : "table",
      oldViewType: this.showListView ? "list" : "table",
      opportunityType: this.opportunityType,
    });
    this.tableViewSelectPresenter.showListView = showListView;
  }

  /**
   * Return a map from column IDs of the opportunity table view to whether or not
   * the column should currently be visible.
   */
  get enabledColumnIds(): Record<OpportunityTableColumnId, boolean> {
    const opportunities = this.peopleInActiveTab;
    return {
      PERSON_NAME: true,
      INSTANCE_DETAILS: some(opportunities, (opp) => !!opp.instanceDetails),
      PERSON_DISPLAY_ID: true,
      ASSIGNED_STAFF_NAME:
        !this.isSupervisorHomepage &&
        some(opportunities, (opp) => !!opp.person.assignedStaffId),
      STATUS: true,
      ELIGIBILITY_DATE: some(opportunities, (opp) => !!opp.eligibilityDate),
      // TODO(#7921): More gracefully handle these special cases
      RELEASE_DATE:
        this.workflowsStore.activeSystem === "INCARCERATION" &&
        ![
          // Michigan facilities opportunities have both min and max release dates,
          // and the release date on the Resident object doesn't agree with them
          "usMiSecurityClassificationCommitteeReview",
          "usMiAddInPersonSecurityClassificationCommitteeReview",
          "usMiWardenInPersonSecurityClassificationCommitteeReview",
        ].includes(this.opportunityType),
      SUPERVISION_EXPIRATION_DATE:
        this.workflowsStore.activeSystem === "SUPERVISION" &&
        ![
          // the Eligibility Date column for FULL_TERM_DISCHARGE opportunities
          // will already display the supervision expiration date
          "pastFTRD",
          "usMiPastFTRD",
          "usTnExpiration",
        ].includes(this.opportunityType),
      LAST_VIEWED: true,
      ALMOST_ELIGIBLE_STATUS: some(
        opportunities,
        (opp: Opportunity) =>
          !opp.denied && !opp.isSubmitted && opp.almostEligibleStatusMessage,
      ),
      SNOOZE_ENDS_IN:
        this.isViewingDeniedTab &&
        some(opportunities, (opp: Opportunity) => !!this.snoozeEndsInDays(opp)),
      SUBMITTED_FOR: this.isViewingSubmittedTab,
      CTA_BUTTON: true,
    };
  }

  /**
   * Returns a custom initial state for the opportunity table view based on the opportunity type
   */
  get initialTableState() {
    if (this.opportunityType === "usIaEarlyDischarge") {
      return {
        sorting: [{ id: "SUPERVISION_EXPIRATION_DATE", desc: false }],
      };
    }
    return undefined;
  }

  submittedForDays(opp: Opportunity): number | undefined {
    if (!opp.submittedUpdate) return;
    return differenceInDays(opp.submittedUpdate.date.toDate(), startOfToday());
  }

  snoozeEndsInDays(opp: Opportunity): number | undefined {
    if (opp.manualSnooze) return opp.snoozeForDays;
    if (opp.autoSnooze && opp.autoSnooze.snoozeUntil) {
      return differenceInDays(
        startOfToday(),
        new Date(opp.autoSnooze.snoozeUntil),
      );
    }
  }

  eligibleForDays(opp: Opportunity): number | undefined {
    if (!opp.eligibilityDate || opp.eligibilityDate > startOfToday()) return;
    return differenceInDays(startOfToday(), opp.eligibilityDate);
  }

  get isViewingDeniedTab() {
    return this.activeTab === this.config.deniedTabTitle;
  }

  get isViewingSubmittedTab() {
    return this.activeTab === this.config.submittedTabTitle;
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
    return (
      this.tabSortingEnabled && this.activeTabGroup === "ELIGIBILITY STATUS"
    );
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
    if (this.supervisionPresenter?.officerRecord) {
      return `${this.supervisionPresenter.officerRecord.displayName}, ${this.config.label}`;
    }
    return this.config.label;
  }

  get callToAction() {
    return this.config.callToAction;
  }

  get subheading() {
    return this.config.subheading;
  }

  get zeroGrantsTooltip() {
    return this.config.zeroGrantsTooltip;
  }

  get eligibilityDateHeader() {
    // Header text for the "eligibility date" column in table view
    return (
      this.config.eligibilityDateTextForTab(this.activeTab) ??
      "Eligibility Date"
    );
  }

  get releaseDateHeader() {
    // Header text for the "release date" column in table view
    return this.tenantStore.labels.releaseDateCopy;
  }

  get supervisionEndHeader() {
    // Header text for the "supervision end date" column in table view
    return this.tenantStore.labels.supervisionEndDateCopy;
  }

  get submittedForHeader() {
    // Header text for the "submitted" column in table view
    const { submittedTabTitle } = this.config;
    return `${toTitleCase(submittedTabTitle.toLowerCase())} for`;
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

  get navigablePeople() {
    return this._navigablePeople;
  }

  /**
   * Set the list of people that a user can navigate through to the current contents of
   * the active tab, in display order (taking into account subcategories if applicable).
   * Called when a new preview modal is opened, so that the list of navigable
   * people does not change even if people move in/out of the active tab.
   */
  updateNavigablePeople() {
    const { peopleInActiveTabBySubcategory, subcategoryOrder } = this;

    // the subcategory order should always be defined if there are currently
    // subcategories
    if (peopleInActiveTabBySubcategory && subcategoryOrder) {
      this._navigablePeople = subcategoryOrder.flatMap(
        (category) => peopleInActiveTabBySubcategory[category] ?? [],
      );
    } else {
      this._navigablePeople = this.peopleInActiveTab;
    }
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
    // We cannot use the supervisionPresenter's selectedOpportunity because the
    // CaseloadOpportunityCell/CaseloadTable change the selected opp in the workflows store;
    // this method will still always return a hydrated opportunity because the
    // selected person is from the correct source and therefore hydrated
    return this.selectedPerson?.opportunities[this.opportunityType]?.find(
      (opp) => opp.selectId === this.workflowsStore.selectedOpportunityId,
    );
  }

  get selectedOpportunityType() {
    if (this.supervisionPresenter) {
      return this.supervisionPresenter.opportunityType;
    }
    return this.workflowsStore.selectedOpportunityType;
  }

  get opportunityConfigs() {
    if (this.supervisionPresenter) {
      // @ts-expect-error accessing private opportunity configuration store
      // because workflows configurations are not hydrated on supervisor homepage
      return this.supervisionPresenter.opportunityConfigurationStore
        ?.apiOpportunityConfigurations;
    }
    return this.workflowsStore.opportunityConfigurationStore
      .apiOpportunityConfigurations;
  }

  get opportunityTypes(): OpportunityType[] {
    if (this.supervisionPresenter) {
      return Object.keys(
        this.supervisionPresenter.opportunitiesByType ?? {},
      ) as OpportunityType[];
    }
    return this.workflowsStore.opportunityTypes;
  }

  urlForOppConfig(config: OpportunityConfiguration) {
    const officerPseudoId =
      // @ts-expect-error accessing private store
      this.supervisionPresenter?.supervisionStore.officerPseudoId;
    if (officerPseudoId) {
      return insightsUrl("supervisionOpportunity", {
        officerPseudoId,
        opportunityTypeUrl: config.urlSection,
      });
    }
    return workflowsUrl("opportunityClients", {
      urlSection: config.urlSection,
    });
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

  get hasMultipleDistinctStatusesInTab() {
    return (
      new Set(
        this.peopleInActiveTab.map((person) => person.eligibilityStatusLabel()),
      ).size > 1
    );
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

  handleOpportunityClick(opp: Opportunity) {
    this.workflowsStore.updateSelectedPersonAndOpportunity(opp);
  }

  shouldHighlightOpportunity(opp: Opportunity) {
    return (
      opp.person.pseudonymizedId === this.selectedPerson?.pseudonymizedId &&
      opp.selectId === this.selectedOpportunity?.selectId
    );
  }
}
