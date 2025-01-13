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
import simplur from "simplur";

import {
  ExcludedSupervisionOfficer,
  OpportunityInfo,
  OpportunityType,
  SupervisionOfficer,
  SupervisionOfficerWithOpportunityDetails,
} from "~datatypes";
import { HydratesFromSource, isHydrated } from "~hydration-utils";

import { JusticeInvolvedPerson, Opportunity } from "../../WorkflowsStore";
import { JusticeInvolvedPersonsStore } from "../../WorkflowsStore/JusticeInvolvedPersonsStore";
import { OpportunityConfigurationStore } from "../../WorkflowsStore/Opportunity/OpportunityConfigurations/OpportunityConfigurationStore";
import { InsightsSupervisionStore } from "../stores/InsightsSupervisionStore";
import { SupervisionSupervisorPresenter } from "./SupervisionSupervisorPresenter";
import {
  RawOpportunityInfo,
  RawOpportunityInfoByOpportunityType,
} from "./types";

export class SupervisionSupervisorOpportunitiesPresenter extends SupervisionSupervisorPresenter {
  constructor(
    supervisionStore: InsightsSupervisionStore,
    supervisorPseudoId: string,
    justiceInvolvedPersonsStore: JusticeInvolvedPersonsStore,
    opportunityConfigurationStore: OpportunityConfigurationStore,
  ) {
    super(
      supervisionStore,
      supervisorPseudoId,
      justiceInvolvedPersonsStore,
      opportunityConfigurationStore,
    );

    // TODO (#7050): Change to use only the populate methods related to this presenter.
    this.hydrator = new HydratesFromSource({
      populate: async () => {
        await Promise.all([...this.populateMethods()]);
        await this.populateCaseload();
      },
      expectPopulated: this.expectPopulated(),
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

  /**
   * Populates the caseload by getting all officers and populating opportunities for them.
   */
  async populateCaseload() {
    if (!this.isWorkflowsEnabled) return;

    const { allOfficers } = this;
    if (allOfficers) {
      await this.populateOpportunitiesForOfficers(
        allOfficers.map((officer) => officer.externalId),
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
   * @param {((SupervisionOfficer | ExcludedSupervisionOfficer)[])} allOfficers
   * @return {*}  {RawOpportunityInfoByOpportunityType}
   */
  protected processOfficersAndOpportunities(
    allOfficers: (SupervisionOfficer | ExcludedSupervisionOfficer)[],
  ): RawOpportunityInfoByOpportunityType {
    return allOfficers.reduce(
      (
        acc: RawOpportunityInfoByOpportunityType,
        officer: SupervisionOfficer | ExcludedSupervisionOfficer,
      ) => {
        const opportunitiesByType =
          this.opportunitiesByTypeForOfficer(officer.externalId) ?? {};

        Object.entries<[OpportunityType, Opportunity<JusticeInvolvedPerson>[]]>(
          opportunitiesByType,
        ).forEach(([oppType, opportunities]) => {
          const opportunityType = oppType as OpportunityType;
          const oppDetail =
            acc.get(opportunityType) ??
            this.initializeOpportunityDetail(opportunityType);

          oppDetail.officersWithEligibleClients.push({
            ...officer,
            clientsEligibleCount: opportunities.length,
            clientsEligibleCountWithLabel: simplur`${opportunities.length} ${this.labels.supervisionJiiLabel}[|s]`,
          });
          oppDetail.clientsEligibleCount += opportunities.length;

          acc.set(opportunityType, oppDetail);
        });

        return acc;
      },
      new Map(),
    );
  }

  /**
   * Builds the opportunities details array from raw opportunity info.
   *
   * @private
   * @param {RawOpportunityInfoByOpportunityType} rawOpportunityInfoMap
   * @returns {OpportunityInfo[]}
   */
  protected buildOpportunitiesDetails(
    rawOpportunityInfoMap: RawOpportunityInfoByOpportunityType,
  ): OpportunityInfo[] {
    return Array.from(rawOpportunityInfoMap.values())
      .toSorted(SupervisionSupervisorPresenter.sortOpportunitiesDetails)
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
    const { homepagePosition, priority, label, zeroGrantsTooltip } =
      this.opportunityConfigurationStore.opportunities[opportunityType];
    return {
      priority,
      label,
      officersWithEligibleClients: [],
      clientsEligibleCount: 0,
      homepagePosition,
      opportunityType,
      zeroGrantsTooltip,
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

  // ==============================
  // Static Sort Functions
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
