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

import { ascending, descending } from "d3-array";
import { isArray, isEmpty, mapValues, mergeWith, transform } from "lodash";
import { flowResult, makeObservable } from "mobx";
import simplur from "simplur";

import {
  OpportunityCardInfo,
  OpportunityType,
  SupervisionOfficer,
  SupervisionOfficerSupervisor,
  SupervisionOfficerWithOpportunityCardDetails,
} from "~datatypes";
import { HydratesFromSource, isHydrated } from "~hydration-utils";

import { insightsUrl } from "../../core/views";
import { PartialRecord } from "../../utils/typeUtils";
import { Opportunity, OpportunityTab } from "../../WorkflowsStore";
import { JusticeInvolvedPersonsStore } from "../../WorkflowsStore/JusticeInvolvedPersonsStore";
import { OpportunityConfigurationStore } from "../../WorkflowsStore/Opportunity/OpportunityConfigurations/OpportunityConfigurationStore";
import { opportunitiesByTabForType } from "../../WorkflowsStore/utils";
import { WithJusticeInvolvedPersonStore } from "../mixins/WithJusticeInvolvedPersonsPresenterMixin";
import { InsightsSupervisionStore } from "../stores/InsightsSupervisionStore";
import { SupervisionBasePresenter } from "./SupervisionBasePresenter";
import {
  NotificationsByType,
  RawOpportunityInfo,
  RawOpportunityInfoByOpportunityType,
} from "./types";
import { addSupervisorReviewCounts, countRelevantOpportunities } from "./utils";

export class SupervisionSupervisorOpportunitiesPresenter extends WithJusticeInvolvedPersonStore(
  SupervisionBasePresenter,
) {
  hydrator: HydratesFromSource;

  constructor(
    supervisionStore: InsightsSupervisionStore,
    public supervisorPseudoId: string,
    justiceInvolvedPersonsStore: JusticeInvolvedPersonsStore,
    protected opportunityConfigurationStore: OpportunityConfigurationStore,
    // Only components that render reviewer-derived data (e.g. the supervisor
    // review table) need this presenter to populate/hydrate the reviewer
    // caseload; other instances should leave the shared caseload alone.
    private readonly includeReviewerCaseload = false,
  ) {
    super(supervisionStore);

    this.justiceInvolvedPersonsStore = justiceInvolvedPersonsStore;
    this.opportunityMapping = "opportunities";
    this.personFieldsToHydrate = ["opportunityManager"];

    makeObservable<
      SupervisionSupervisorOpportunitiesPresenter,
      | "expectOfficersPopulated"
      | "expectSupervisorPopulated"
      | "hydrator"
      | "hydrationState"
      | "initializeOpportunityDetail"
      | "populateCaseload"
      | "populateCaseloadForCurrentReviewer"
      | "expectCaseloadPopulated"
      | "expectCaseloadPopulatedForReviewer"
    >(
      this,
      {
        expectOfficersPopulated: true,
        expectSupervisorPopulated: true,
        supervisorPseudoId: true,
        allOfficers: true,
        hydrate: true,
        hydrator: true,
        populateCaseload: true,
        populateCaseloadForCurrentReviewer: true,
        expectCaseloadPopulated: true,
        expectCaseloadPopulatedForReviewer: true,
        hydrationState: true,
        initializeOpportunityDetail: true,
        opportunitiesDetails: true,
        opportunitiesDetailsForReviewer: true,
        populateOpportunityConfigurationStore: true,
        expectOpportunityConfigurationStorePopulated: true,
        shouldSplitByTab: true,
        opportunityDetailsByTab: true,
        opportunitiesDetailsForCardGrid: true,
        alertOpportunitiesNotificationsByOpportunityType: true,
        isNotificationBannerEnabled: true,
        isInsightsSupervisorReviewTableEnabled: true,
        supervisorInfo: true,
      },
      { autoBind: true },
    );

    this.hydrator = new HydratesFromSource({
      populate: async () => {
        await Promise.all([
          flowResult(
            this.supervisionStore.populateOfficersForSupervisor(
              this.supervisorPseudoId,
            ),
          ),
          flowResult(this.populateOpportunityConfigurationStore()),
          ...(this.isInsightsSupervisorReviewTableEnabled
            ? [
                flowResult(
                  this.supervisionStore.populateSupervisionOfficerSupervisors(),
                ),
              ]
            : []),
        ]);
        await this.populateCaseload();
        await this.populateCaseloadForCurrentReviewer();
      },
      expectPopulated: [
        this.expectOfficersPopulated,
        ...(this.isInsightsSupervisorReviewTableEnabled
          ? [this.expectSupervisorPopulated]
          : []),
        this.expectOpportunityConfigurationStorePopulated,
        ...this.allOfficers.map(
          (o) => () => this.expectCaseloadPopulated(o.externalId),
        ),
        ...(this.includeReviewerCaseload &&
        this.isInsightsSupervisorReviewTableEnabled
          ? [
              () =>
                this.expectCaseloadPopulatedForReviewer(
                  this.supervisorInfo?.externalId,
                ),
            ]
          : []),
      ],
    });
  }

  get supervisorIsCurrentUser(): boolean {
    return this.supervisionStore.supervisorIsCurrentUser;
  }

  /**
   * Provides information about the currently selected supervisor.
   * @returns The supervisor record, or `undefined` if not yet fetched.
   */
  get supervisorInfo(): SupervisionOfficerSupervisor | undefined {
    return this.supervisionStore.supervisorInfo(this.supervisorPseudoId);
  }

  get isNotificationBannerEnabled() {
    const { insightsSupervisorOpportunityNotifications } =
      this.supervisionStore.insightsStore.rootStore.workflowsStore
        .featureVariants;
    return (
      !!insightsSupervisorOpportunityNotifications && this.isWorkflowsEnabled
    );
  }

  /**
   * Returns a map of opportunity types to their active notifications.
   * @returns A map of opportunity types to their notifications.
   */
  get alertOpportunitiesNotificationsByOpportunityType():
    | NotificationsByType
    | undefined {
    const { allOfficers, isNotificationBannerEnabled } = this;

    if (!isNotificationBannerEnabled) return undefined;

    const notificationsByTypeResult: NotificationsByType = {};

    return allOfficers.reduce((acc, { externalId }) => {
      const notificationsByType = mapValues(
        this.opportunitiesByTypeForOfficer(externalId),
        (opportunities, opportunityType: OpportunityType) => {
          // Sort opportunities so the most overdue (oldest/missing lastContactDate) appear first
          const sortedOpportunities = [...opportunities].sort((a, b) => {
            const aDate = a.record?.lastContactDate;
            const bDate = b.record?.lastContactDate;
            if (aDate && bDate) return +aDate - +bDate;
            if (!aDate && !bDate) return 0;
            // Null/missing dates sort first (most overdue)
            return aDate ? 1 : -1;
          });

          // Aggregate all alert-type notifications for the supervisionSupervisor page
          const notifications = sortedOpportunities
            .flatMap(
              (opportunity) =>
                opportunity.notificationsByPage?.supervisionSupervisor ?? [],
            )
            .filter((notification) => notification.type === "alert");

          if (notifications.length === 0) return undefined;

          const { urlSection } =
            this.opportunityConfigurationStore.opportunities[opportunityType];

          // Build the URL for "See More" link
          const seeMoreLink = insightsUrl("supervisionSupervisorOpportunity", {
            supervisorPseudoId: this.supervisorPseudoId,
            opportunityTypeUrl: urlSection,
          });

          return {
            notifications,
            seeMoreLink,
          };
        },
      );

      return mergeWith(acc, notificationsByType, (srcValue, otherValue) => {
        if (isArray(srcValue) && isArray(otherValue))
          return srcValue.concat(otherValue);
      });
    }, notificationsByTypeResult);
  }

  // ==============================
  // Opportunity Details
  // ==============================

  /**
   * Provides details about supervision supervisor opportunities.
   * @returns An array of `OpportunityInfo` or `undefined` if workflows are not enabled or data is not available.
   */
  get opportunitiesDetails(): OpportunityCardInfo[] | undefined {
    if (!this.isWorkflowsEnabled) return;

    const { allOfficers } = this;

    return allOfficers
      ? this.buildOpportunitiesDetails(
          this.processOfficersAndOpportunities(allOfficers),
        )
      : [];
  }

  /**
   * Provides details about supervision supervisor opportunities for a given reviewer.
   * @returns An array of `OpportunityInfo` or `undefined` if workflows are not enabled or data is not available.
   */
  get opportunitiesDetailsForReviewer(): OpportunityCardInfo[] | undefined {
    if (!this.isWorkflowsEnabled) return;

    if (this.isInsightsSupervisorReviewTableEnabled) {
      const { externalId } = this.supervisorInfo ?? {};
      if (!externalId) return [];
      return this.buildOpportunitiesDetails(
        this.processReviewerOpportunities(externalId),
      );
    }

    return [];
  }

  /**
   * For a given opportunity card, split the aggregated card information up by tab and
   * return the list of card info objects for each tab.
   */
  opportunityDetailsByTab(oppInfo: OpportunityCardInfo): OpportunityCardInfo[] {
    const {
      label: oppLabel,
      officersWithRelevantClients,
      opportunityType,
      urlSection,
      priority,
      zeroGrantsTooltip,
    } = oppInfo;

    const relevantTabTitles = this.cardTabTitlesForType(opportunityType);

    const cardInfoByTab = officersWithRelevantClients.reduce((acc, officer) => {
      const { countsByTab } = officer;
      if (!countsByTab) return acc;

      // Loop through the relevant officers and aggregate card information by tab
      // title.
      Object.entries(countsByTab)
        .filter(([tabTitle, _]) =>
          relevantTabTitles.includes(tabTitle as OpportunityTab),
        )
        .forEach(([tabTitle, officerClientCount]) => {
          const cardInfoForTab: RawOpportunityInfo = acc.get(tabTitle) ?? {
            label: `${oppLabel}: ${tabTitle}`,
            opportunityType,
            urlSection,
            relevantClientsCount: 0,
            priority,
            zeroGrantsTooltip,
            officersWithRelevantClients: [],
            homepagePosition:
              this.opportunityConfigurationStore.opportunities[opportunityType]
                .homepagePosition,
          };

          cardInfoForTab.officersWithRelevantClients.push({
            ...officer,
            clientsCount: officerClientCount,
            clientsCountWithLabel: simplur`${officerClientCount} ${this.labels.supervisionJiiLabel}[|s]`,
          });
          cardInfoForTab.relevantClientsCount += officerClientCount;
          cardInfoForTab.officersWithRelevantClients.sort(
            SupervisionSupervisorOpportunitiesPresenter.sortSupervisionOfficerWithOpportunityCardDetails,
          );
          acc.set(tabTitle, cardInfoForTab);
        });

      return acc;
    }, new Map<string, RawOpportunityInfo>());

    return Array.from(cardInfoByTab.values()).toSorted(
      SupervisionSupervisorOpportunitiesPresenter.sortOpportunitiesDetails,
    );
  }

  get isReviewCardEnabled(): boolean {
    return !!this.supervisionStore.insightsStore.rootStore.userStore
      .activeFeatureVariants.supervisorHomepageReviewCard;
  }

  get isInsightsSupervisorReviewTableEnabled(): boolean {
    return !!this.supervisionStore.insightsStore.rootStore.userStore
      .activeFeatureVariants.supervisorHomepageReviewTable;
  }

  /**
   * Filters down the list of opportunity information to just those opportunities
   * with outstanding supervisor review requests.
   *
   * This field is used to generate the supervisor review cards in the
   * Opportunities Module.
   */
  get opportunitiesDetailsForSupervisorReview():
    | OpportunityCardInfo[]
    | undefined {
    if (!this.isReviewCardEnabled) {
      return [];
    }

    if (this.isInsightsSupervisorReviewTableEnabled) {
      return this.opportunitiesDetailsForReviewer?.filter(
        (oppInfo) => !isEmpty(oppInfo.supervisorReviewCounts),
      );
    }

    return this.opportunitiesDetails?.filter(
      (oppInfo) => !isEmpty(oppInfo.supervisorReviewCounts),
    );
  }

  /**
   * Returns the array of card info objects to be rendered in the opportunities module.
   * Handles splitting up an opportunity card into individual tab cards when relevant.
   */
  get opportunitiesDetailsForCardGrid(): OpportunityCardInfo[] {
    if (!this.opportunitiesDetails) return [];
    return this.opportunitiesDetails.flatMap((oppDetail) =>
      this.shouldSplitByTab(oppDetail.opportunityType)
        ? this.opportunityDetailsByTab(oppDetail)
        : oppDetail,
    );
  }

  get labels() {
    return this.supervisionStore.labels;
  }

  /**
   * Combines and returns all officers under this supervisor.
   * @returns An array of `SupervisionOfficer` (empty if array not available).
   */
  get allOfficers(): SupervisionOfficer[] {
    return (
      this.supervisionStore.officersBySupervisorPseudoId.get(
        this.supervisorPseudoId,
      ) ?? []
    );
  }

  /**
   * Populates the caseload for the current supervisor as a reviewer.
   */
  async populateCaseloadForCurrentReviewer() {
    if (
      !this.includeReviewerCaseload ||
      !this.isInsightsSupervisorReviewTableEnabled
    ) {
      return;
    }

    const { externalId } = this.supervisorInfo ?? {};
    if (externalId) {
      await this.populateCaseloadForReviewer(externalId);
    }
  }

  /**
   * Populates the caseload by getting all officers and populating opportunities for them.
   */
  async populateCaseload() {
    if (!this.isWorkflowsEnabled) return;

    const { allOfficers } = this;

    if (allOfficers) {
      await Promise.all(
        allOfficers.map((officer) =>
          this.populateCaseloadForOfficer(officer.externalId),
        ),
      );
    }
  }

  /**
   * Populates the opportunity configuration store.
   */
  async populateOpportunityConfigurationStore() {
    this.opportunityConfigurationStore.hydrate();
  }

  /**
   * Processes officers and their clients, creating a map of raw opportunity details.
   *
   * @param {(SupervisionOfficer[])} allOfficers
   * @return {*}  {RawOpportunityInfoByOpportunityType}
   */
  protected processOfficersAndOpportunities(
    allOfficers: SupervisionOfficer[],
  ): RawOpportunityInfoByOpportunityType {
    return allOfficers.reduce(
      (
        acc: RawOpportunityInfoByOpportunityType,
        officer: SupervisionOfficer,
      ) => {
        const opportunitiesByType: PartialRecord<
          OpportunityType,
          Opportunity[]
        > = this.opportunitiesByTypeForOfficer(officer.externalId) ?? {};

        // For every opportunity type, add info for this officer to the returned map
        Object.entries(opportunitiesByType).forEach(
          ([oppType, opportunities]) => {
            const opportunityType = oppType as OpportunityType;
            const oppDetail =
              acc.get(opportunityType) ??
              this.initializeOpportunityDetail(opportunityType);

            const {
              countByFunction,
              supportsSupervisorReview,
              supervisorReviewTabTitle,
            } =
              this.opportunityConfigurationStore.opportunities[opportunityType];

            // Use a custom counting function defined for this opportunity when one exists.
            // Otherwise, only count eligible opportunities.
            const clientCountForOfficer = countRelevantOpportunities(
              opportunities,
              countByFunction,
            );

            const oppsByTabForOfficer =
              opportunitiesByTabForType(opportunities);

            // If we need to surface status counts for supervisor review,
            // handle adding the current officer's counts to the supervisor
            // totals.
            if (this.isReviewCardEnabled && supportsSupervisorReview) {
              addSupervisorReviewCounts(oppDetail, oppsByTabForOfficer, [
                supervisorReviewTabTitle,
              ]);
            }

            // If we need to surface opportunity counts by tab
            // handle adding the current officer's counts to this opportunity's
            // totals
            const countsByTabForOfficer = this.shouldSplitByTab(opportunityType)
              ? transform(
                  oppsByTabForOfficer,
                  (oppCountsByTab, opps, tab) =>
                    (oppCountsByTab[tab] = opps.length),
                  {} as Record<string, number>,
                )
              : undefined;

            if (clientCountForOfficer > 0) {
              oppDetail.officersWithRelevantClients.push({
                ...officer,
                clientsCount: clientCountForOfficer,
                clientsCountWithLabel: simplur`${clientCountForOfficer} ${this.labels.supervisionJiiLabel}[|s]`,
                countsByTab: countsByTabForOfficer,
              });
              oppDetail.relevantClientsCount += clientCountForOfficer;

              acc.set(opportunityType, oppDetail);
            }
          },
        );

        return acc;
      },
      new Map(),
    );
  }

  /**
   * Processes a reviewer's clients, creating a map of raw opportunity details.
   *
   * @param {string} reviewerId - The external ID of the reviewer (supervisor).
   * @return {*}  {RawOpportunityInfoByOpportunityType}
   */
  protected processReviewerOpportunities(
    reviewerId: string,
  ): RawOpportunityInfoByOpportunityType {
    const opportunitiesByType: PartialRecord<OpportunityType, Opportunity[]> =
      this.opportunitiesByTypeForReviewer(reviewerId) ?? {};

    return Object.entries(opportunitiesByType).reduce(
      (acc: RawOpportunityInfoByOpportunityType, [oppType, opportunities]) => {
        const opportunityType = oppType as OpportunityType;
        const oppDetail =
          acc.get(opportunityType) ??
          this.initializeOpportunityDetail(opportunityType);

        const {
          countByFunction,
          supportsSupervisorReview,
          supervisorReviewTabTitle,
          insightsSupervisorReviewTabTitle,
          awaitingRevisionsTabTitle,
        } = this.opportunityConfigurationStore.opportunities[opportunityType];

        // TODO (OBT-39704) Refactor OpportunityTabGroup to enums
        const oppsByTab = opportunitiesByTabForType(
          opportunities,
          insightsSupervisorReviewTabTitle
            ? "REVIEW STATUS"
            : "ELIGIBILITY STATUS",
        );

        const clientCount = countRelevantOpportunities(
          opportunities,
          countByFunction,
        );

        // TODO (OBT-39704) Refactor OpportunityTabGroup to enums
        if (
          this.isReviewCardEnabled &&
          supportsSupervisorReview &&
          insightsSupervisorReviewTabTitle
        ) {
          addSupervisorReviewCounts(
            oppDetail,
            oppsByTab,
            [insightsSupervisorReviewTabTitle, awaitingRevisionsTabTitle],
            "REVIEW STATUS",
          );
        } else if (this.isReviewCardEnabled && supportsSupervisorReview) {
          addSupervisorReviewCounts(oppDetail, oppsByTab, [
            supervisorReviewTabTitle,
            awaitingRevisionsTabTitle,
          ]);
        }

        if (clientCount > 0) {
          oppDetail.relevantClientsCount += clientCount;
        }

        acc.set(opportunityType, oppDetail);

        return acc;
      },
      new Map(),
    );
  }

  shouldSplitByTab(oppType: OpportunityType): boolean {
    return !isEmpty(this.cardTabTitlesForType(oppType));
  }

  cardTabTitlesForType(oppType: OpportunityType): OpportunityTab[] {
    if (oppType === "usIaEarlyDischarge") {
      return ["Eligible Now", "Ready for Discharge", "Revisions Requests"];
    }

    return [];
  }

  /**
   * Builds the opportunities details array from raw opportunity info.
   *
   * @param {RawOpportunityInfoByOpportunityType} rawOpportunityInfoMap
   * @returns {OpportunityCardInfo[]}
   */
  protected buildOpportunitiesDetails(
    rawOpportunityInfoMap: RawOpportunityInfoByOpportunityType,
  ): OpportunityCardInfo[] {
    return Array.from(rawOpportunityInfoMap.values())
      .toSorted(
        SupervisionSupervisorOpportunitiesPresenter.sortOpportunitiesDetails,
      )
      .map(({ officersWithRelevantClients, homepagePosition, ...rest }) => ({
        ...rest,
        officersWithRelevantClients: officersWithRelevantClients.toSorted(
          SupervisionSupervisorOpportunitiesPresenter.sortSupervisionOfficerWithOpportunityCardDetails,
        ),
      }));
  }

  /**
   * Initializes an opportunity detail object for a given opportunity type.
   *
   * @param {OpportunityType} opportunityType
   * @returns {RawOpportunityInfo}
   */
  protected initializeOpportunityDetail(
    opportunityType: OpportunityType,
  ): RawOpportunityInfo {
    const { homepagePosition, priority, label, zeroGrantsTooltip, urlSection } =
      this.opportunityConfigurationStore.opportunities[opportunityType];
    return {
      priority,
      label,
      officersWithRelevantClients: [],
      relevantClientsCount: 0,
      homepagePosition,
      opportunityType,
      zeroGrantsTooltip,
      supervisorReviewCounts: {},
      urlSection,
    };
  }

  /**
   * Asserts that the opportunity configuration store has been populated.
   * @throws An error if the store is not hydrated.
   */
  expectOpportunityConfigurationStorePopulated() {
    if (!isHydrated(this.opportunityConfigurationStore))
      throw new Error("Opportunity configuration store not hydrated");
  }

  /**
   * Asserts that officers have been populated.
   * @throws An error if officers are not populated.
   */
  protected expectOfficersPopulated() {
    if (
      !this.supervisionStore.officersBySupervisorPseudoId.has(
        this.supervisorPseudoId,
      )
    )
      throw new Error("failed to populate officers with outliers");
  }

  /**
   * Asserts that the supervisor has been populated.
   * @throws An error if the supervisor is not populated.
   */
  protected expectSupervisorPopulated() {
    if (!this.supervisorInfo)
      throw new Error("Failed to populate supervisor info");
  }

  // ==============================
  // Static Functions for sorting officers and opportunities
  // ==============================

  /**
   * Static method to sort opportunities details by priority, homepage position, and clients eligible count.
   *
   * @param {RawOpportunityInfo} a - The first opportunity info to compare.
   * @param {RawOpportunityInfo} b - The second opportunity info to compare.
   * @returns The comparison result as a number.
   */
  static sortOpportunitiesDetails(
    a: RawOpportunityInfo,
    b: RawOpportunityInfo,
  ) {
    // HIGH priority opportunityTypes should be first
    if (a.priority !== b.priority) return a.priority === "HIGH" ? -1 : 1;

    // Check homepage position
    if (a.homepagePosition !== b.homepagePosition)
      return ascending(a.homepagePosition, b.homepagePosition);

    // Highest clients eligible count
    if (a.relevantClientsCount !== b.relevantClientsCount)
      return descending(a.relevantClientsCount, b.relevantClientsCount);

    // Compare by label finally
    return a.label.localeCompare(b.label);
  }

  /**
   * Static method to sort supervision officers with opportunity details by clients eligible count and name.
   *
   * @param {SupervisionOfficerWithOpportunityCardDetails} a - The first officer to compare.
   * @param {SupervisionOfficerWithOpportunityCardDetails} b - The second officer to compare.
   * @returns The comparison result as a number.
   */
  static sortSupervisionOfficerWithOpportunityCardDetails(
    a: SupervisionOfficerWithOpportunityCardDetails,
    b: SupervisionOfficerWithOpportunityCardDetails,
  ) {
    const clientsCompare = descending(a.clientsCount, b.clientsCount);
    // name
    return clientsCompare !== 0
      ? clientsCompare
      : a.displayName.localeCompare(b.displayName);
  }
}
