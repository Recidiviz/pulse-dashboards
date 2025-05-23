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

import { makeObservable, override } from "mobx";

import { OpportunityType } from "~datatypes";
import { HydratesFromSource } from "~hydration-utils";

import { JusticeInvolvedPerson } from "../../WorkflowsStore";
import { JusticeInvolvedPersonsStore } from "../../WorkflowsStore/JusticeInvolvedPersonsStore";
import { OpportunityConfigurationStore } from "../../WorkflowsStore/Opportunity/OpportunityConfigurations/OpportunityConfigurationStore";
import { WithJusticeInvolvedPersonStore } from "../mixins/WithJusticeInvolvedPersonsPresenterMixin";
import { InsightsSupervisionStore } from "../stores/InsightsSupervisionStore";
import { SupervisionOfficerPresenterBase } from "./SupervisionOfficerPresenterBase";

export class SupervisionOfficerOpportunitiesPresenter extends WithJusticeInvolvedPersonStore(
  SupervisionOfficerPresenterBase,
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
      SupervisionOfficerOpportunitiesPresenter,
      "expectCaseloadPopulated" | "populateCaseload"
    >(this, {
      isWorkflowsEnabled: true,
      expectCaseloadPopulated: true,
      populateCaseload: true,
      clients: true,
      numClientsOnCaseload: true,
      numEligibleOpportunities: true,
      opportunitiesByType: true,
      hydrate: override,
      hydrationState: override,
    });

    this.personFieldsToHydrate = ["opportunityManager"];

    this.hydrator = new HydratesFromSource({
      expectPopulated: [
        this.expectSupervisorPopulated,
        this.expectOfficerPopulated,
        () => this.expectCaseloadPopulated(this.officerExternalId),
      ],
      populate: async () => {
        await Promise.all([
          this.supervisionStore.populateSupervisionOfficerSupervisors(),
          this.populateSupervisionOfficer(),
        ]);

        // This needs to happen after the above are hydrated
        // so it can use the externalId to find the opportunities.
        await this.populateCaseload();
      },
    });
  }

  private async populateCaseload() {
    if (!this.isWorkflowsEnabled || !this.officerExternalId) return;
    await this.populateCaseloadForOfficer(this.officerExternalId);
  }

  get clients(): JusticeInvolvedPerson[] | undefined {
    return this.officerExternalId
      ? this.findClientsForOfficer(this.officerExternalId)
      : undefined;
  }

  get numClientsOnCaseload(): number | undefined {
    return this.clients?.length;
  }

  get opportunitiesByType() {
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
}
