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
import { isEmpty } from "lodash";
import { flowResult, makeObservable } from "mobx";
import simplur from "simplur";

import {
  OpportunityInfo,
  OpportunityType,
  SupervisionOfficer,
  SupervisionOfficerWithOpportunityDetails,
} from "~datatypes";
import { HydratesFromSource, isHydrated } from "~hydration-utils";

import { PartialRecord } from "../../utils/typeUtils";
import { Opportunity } from "../../WorkflowsStore";
import { JusticeInvolvedPersonsStore } from "../../WorkflowsStore/JusticeInvolvedPersonsStore";
import { OpportunityConfigurationStore } from "../../WorkflowsStore/Opportunity/OpportunityConfigurations/OpportunityConfigurationStore";
import {
  isEligible,
  opportunitiesByTabForType,
} from "../../WorkflowsStore/utils";
import { WithJusticeInvolvedPersonStore } from "../mixins/WithJusticeInvolvedPersonsPresenterMixin";
import { InsightsSupervisionStore } from "../stores/InsightsSupervisionStore";
import { SupervisionBasePresenter } from "./SupervisionBasePresenter";
import {
  RawOpportunityInfo,
  RawOpportunityInfoByOpportunityType,
} from "./types";

export class SupervisionSupervisorOpportunitiesPresenter extends WithJusticeInvolvedPersonStore(
  SupervisionBasePresenter,
) {
  hydrator: HydratesFromSource;

  constructor(
    supervisionStore: InsightsSupervisionStore,
    public supervisorPseudoId: string,
    justiceInvolvedPersonsStore: JusticeInvolvedPersonsStore,
    private opportunityConfigurationStore: OpportunityConfigurationStore,
  ) {
    super(supervisionStore);

    this.justiceInvolvedPersonsStore = justiceInvolvedPersonsStore;
    this.opportunityMapping = "opportunities";
    this.personFieldsToHydrate = ["opportunityManager"];

    makeObservable<
      SupervisionSupervisorOpportunitiesPresenter,
      | "expectOfficersPopulated"
      | "hydrator"
      | "hydrationState"
      | "initializeOpportunityDetail"
      | "populateCaseload"
      | "expectCaseloadPopulated"
    >(
      this,
      {
        opportunityMapping: true,
        expectOfficersPopulated: true,
        supervisorPseudoId: true,
        allOfficers: true,
        hydrate: true,
        hydrator: true,
        populateCaseload: true,
        expectCaseloadPopulated: true,
        hydrationState: true,
        initializeOpportunityDetail: true,
        opportunitiesDetails: true,
        populateOpportunityConfigurationStore: true,
        expectOpportunityConfigurationStorePopulated: true,
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
        ]);
        await this.populateCaseload();
      },
      expectPopulated: [
        this.expectOfficersPopulated,
        this.expectOpportunityConfigurationStorePopulated,
        ...this.allOfficers.map(
          (o) => () => this.expectCaseloadPopulated(o.externalId),
        ),
      ],
    });
  }

  // ==============================
  // Opportunity Details
  // ==============================

  /**
   * Provides details about supervision supervisor opportunities.
   * @returns An array of `OpportunityInfo` or `undefined` if workflows are not enabled or data is not available.
   */
  get opportunitiesDetails(): OpportunityInfo[] | undefined {
    if (!this.isWorkflowsEnabled) return;

    const { allOfficers } = this;

    return allOfficers
      ? this.buildOpportunitiesDetails(
          this.processOfficersAndOpportunities(allOfficers),
        )
      : [];
  }

  get isReviewCardEnabled(): boolean {
    return !!this.supervisionStore.insightsStore.rootStore.userStore
      .activeFeatureVariants.supervisorHomepageReviewCard;
  }

  /**
   * Filters down the list of opportunity information to just those opportunities
   * with outstanding supervisor review requests.
   *
   * This field is used to generate the supervisor review cards in the
   * Opportunities Module.
   */
  get opportunitiesDetailsForSupervisorReview(): OpportunityInfo[] | undefined {
    if (!this.isReviewCardEnabled) {
      return [];
    }
    return this.opportunitiesDetails?.filter(
      (oppInfo) => !isEmpty(oppInfo.supervisorReviewCounts),
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
            const clientCountForOfficer = countByFunction
              ? countByFunction(opportunities)
              : opportunities.filter((opp) => opp && isEligible(opp)).length;

            const oppsByTabForOfficer =
              opportunitiesByTabForType(opportunities);

            // If we need to surface status counts for supervisor review,
            // handle adding the current officer's counts to the supervisor
            // totals.
            if (
              this.isReviewCardEnabled &&
              supportsSupervisorReview &&
              oppsByTabForOfficer[supervisorReviewTabTitle]?.length
            ) {
              const reviewOpps = oppsByTabForOfficer[supervisorReviewTabTitle];
              reviewOpps.forEach((opp) => {
                const statusLabel = opp.eligibilityStatusLabel();
                if (statusLabel) {
                  oppDetail.supervisorReviewCounts[statusLabel] =
                    oppDetail.supervisorReviewCounts[statusLabel] + 1 || 1;
                }
              });
            }

            if (clientCountForOfficer > 0) {
              oppDetail.officersWithEligibleClients.push({
                ...officer,
                clientsEligibleCount: clientCountForOfficer,
                clientsEligibleCountWithLabel: simplur`${clientCountForOfficer} ${this.labels.supervisionJiiLabel}[|s]`,
              });
              oppDetail.clientsEligibleCount += clientCountForOfficer;

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
   * Builds the opportunities details array from raw opportunity info.
   *
   * @param {RawOpportunityInfoByOpportunityType} rawOpportunityInfoMap
   * @returns {OpportunityInfo[]}
   */
  protected buildOpportunitiesDetails(
    rawOpportunityInfoMap: RawOpportunityInfoByOpportunityType,
  ): OpportunityInfo[] {
    return Array.from(rawOpportunityInfoMap.values())
      .toSorted(
        SupervisionSupervisorOpportunitiesPresenter.sortOpportunitiesDetails,
      )
      .map(({ officersWithEligibleClients, homepagePosition, ...rest }) => ({
        ...rest,
        officersWithEligibleClients: officersWithEligibleClients.toSorted(
          SupervisionSupervisorOpportunitiesPresenter.sortSupervisionOfficerWithOpportunityDetails,
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
      officersWithEligibleClients: [],
      clientsEligibleCount: 0,
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
    if (a.clientsEligibleCount !== b.clientsEligibleCount)
      return descending(a.clientsEligibleCount, b.clientsEligibleCount);

    // Compare by label finally
    return a.label.localeCompare(b.label);
  }

  /**
   * Static method to sort supervision officers with opportunity details by clients eligible count and name.
   *
   * @param {SupervisionOfficerWithOpportunityDetails} a - The first officer to compare.
   * @param {SupervisionOfficerWithOpportunityDetails} b - The second officer to compare.
   * @returns The comparison result as a number.
   */
  static sortSupervisionOfficerWithOpportunityDetails(
    a: SupervisionOfficerWithOpportunityDetails,
    b: SupervisionOfficerWithOpportunityDetails,
  ) {
    const clientsEligibleCompare = descending(
      a.clientsEligibleCount,
      b.clientsEligibleCount,
    );
    // name
    return clientsEligibleCompare !== 0
      ? clientsEligibleCompare
      : a.displayName.localeCompare(b.displayName);
  }
}
