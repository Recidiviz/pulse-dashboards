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

import { flowResult, makeObservable, override } from "mobx";

import {
  ExcludedSupervisionOfficer,
  OpportunityType,
  SupervisionOfficer,
} from "~datatypes";
import { FlowMethod, HydratesFromSource } from "~hydration-utils";

import { JusticeInvolvedPerson, Opportunity } from "../../WorkflowsStore";
import { JusticeInvolvedPersonsStore } from "../../WorkflowsStore/JusticeInvolvedPersonsStore";
import { OpportunityConfigurationStore } from "../../WorkflowsStore/Opportunity/OpportunityConfigurations/OpportunityConfigurationStore";
import { InsightsAPI } from "../api/interface";
import { WithJusticeInvolvedPersonStore } from "../mixins/WithJusticeInvolvedPersonsPresenterMixin";
import { InsightsSupervisionStore } from "../stores/InsightsSupervisionStore";
import { SupervisionOfficerPresenterBase } from "./SupervisionOfficerPresenterBase";
import { HighlightedOfficersDetail } from "./types";
import {
  getHighlightedOfficersByMetric,
  isExcludedSupervisionOfficer,
} from "./utils";

export class SupervisionOfficerPresenter<
  T extends SupervisionOfficer | ExcludedSupervisionOfficer,
> extends WithJusticeInvolvedPersonStore(
  SupervisionOfficerPresenterBase<
    SupervisionOfficer | ExcludedSupervisionOfficer
  >,
) {
  constructor(
    protected supervisionStore: InsightsSupervisionStore,
    public officerPseudoId: string,
    justiceInvolvedPersonStore: JusticeInvolvedPersonsStore,
    private opportunityConfigurationStore: OpportunityConfigurationStore,
  ) {
    super(supervisionStore, officerPseudoId);
    this.justiceInvolvedPersonsStore = justiceInvolvedPersonStore;

    makeObservable<
      SupervisionOfficerPresenter<T>,
      | "populateSupervisionOfficer"
      | "expectClientsPopulated"
      | "populateCaseload"
    >(this, {
      isWorkflowsEnabled: true,
      expectClientsPopulated: true,
      populateCaseload: true,
      clients: true,
      numClientsOnCaseload: true,
      numEligibleOpportunities: true,
      opportunitiesByType: true,
      populateSupervisionOfficer: override,
      hydrate: override,
      hydrationState: override,
    });

    this.hydrator = new HydratesFromSource({
      expectPopulated: [
        ...super.expectPopulated(),
        () => this.expectClientsPopulated(this.officerExternalId),
      ],
      populate: async () => {
        await Promise.all(super.populateMethods());
        // These need to happen after the above calls so that the officer record is hydrated
        await Promise.all([
          this.populateCaseload(),
          flowResult(this.populateSupervisionOfficerOutcomes()),
        ]);
      },
    });
  }

  private async populateCaseload() {
    if (!this.isWorkflowsEnabled || !this.officerExternalId) return;
    await this.populateOpportunitiesForOfficer(this.officerExternalId);
  }

  get clients(): JusticeInvolvedPerson[] | undefined {
    return this.officerExternalId
      ? this.findClientsForOfficer(this.officerExternalId)
      : undefined;
  }

  get numClientsOnCaseload(): number | undefined {
    return this.clients?.length;
  }

  get opportunitiesByType():
    | Record<OpportunityType, Opportunity[]>
    | undefined {
    return this.officerExternalId
      ? this.opportunitiesByTypeForOfficer(this.officerExternalId)
      : undefined;
  }

  /**
   * The relevant opportunity types for this officer in display order.
   */
  get opportunityTypes(): OpportunityType[] {
    if (!this.opportunitiesByType) return [];
    return (Object.keys(this.opportunitiesByType) as OpportunityType[]).sort(
      (a, b) =>
        this.opportunityConfigurationStore.opportunities[a].homepagePosition -
        this.opportunityConfigurationStore.opportunities[b].homepagePosition,
    );
  }

  get numEligibleOpportunities(): number | undefined {
    return this.countOpportunitiesForOfficer(this.officerExternalId);
  }

  /**
   * Passthrough to the SupervisionStore
   * Checks if Vitals is enabled based on user permissions.
   * @returns `true` if vitals is enabled, otherwise `false`.
   */
  get isVitalsEnabled() {
    return this.supervisionStore.isVitalsEnabled;
  }

  /**
   * Returns metrics where this officer meets the top X percent criteria.
   * @returns An array of objects containing the metric, top X percent criteria, and info about
   * officers meeting the top X percent criteria.
   */
  get officerHighlights(): HighlightedOfficersDetail[] {
    return getHighlightedOfficersByMetric(this.metricConfigsById, [
      this.officerRecord as SupervisionOfficer,
    ]);
  }

  protected expectMetricsPopulated() {
    if (isExcludedSupervisionOfficer(this.fetchedOfficerRecord)) return;
    super.expectMetricsPopulated();
  }

  /**
   * Fetch record for current officer.
   */
  protected *populateSupervisionOfficer(): FlowMethod<
    InsightsAPI["supervisionOfficer" | "excludedSupervisionOfficer"],
    void
  > {
    if (this.isOfficerPopulated) return;
    try {
      this.fetchedOfficerRecord =
        yield this.supervisionStore.insightsStore.apiClient.supervisionOfficer(
          this.officerPseudoId,
        );
    } catch (e) {
      // TODO: (#6044) Remove once they work with the same endpoint.
      this.fetchedOfficerRecord =
        yield this.supervisionStore.insightsStore.apiClient.excludedSupervisionOfficer(
          this.officerPseudoId,
        );
    }
  }
}
