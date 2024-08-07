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

import { FlowMethod, HydratesFromSource } from "~hydration-utils";

import UserStore from "../../RootStore/UserStore";
import {
  JusticeInvolvedPerson,
  Opportunity,
  OpportunityType,
} from "../../WorkflowsStore";
import { JusticeInvolvedPersonsStore } from "../../WorkflowsStore/JusticeInvolvedPersonsStore";
import { InsightsAPI } from "../api/interface";
import { InsightsSupervisionStore } from "../stores/InsightsSupervisionStore";
import { SupervisionOfficerPresenterBase } from "./SupervisionOfficerPresenterBase";

export class SupervisionOfficerPresenter extends SupervisionOfficerPresenterBase {
  constructor(
    supervisionStore: InsightsSupervisionStore,
    private justiceInvolvedPersonsStore: JusticeInvolvedPersonsStore,
    private userStore: UserStore,
    officerPseudoId: string,
  ) {
    super(supervisionStore, officerPseudoId);

    makeObservable<
      SupervisionOfficerPresenter,
      | "populateSupervisionOfficer"
      | "expectClientsPopulated"
      | "populateCaseload"
    >(this, {
      metricConfigsById: true,
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
      expectPopulated: [...super.expectPopulated, this.expectClientsPopulated],
      populate: async () => {
        await Promise.all(super.populateMethods);
        // this needs to happen after the above calls so that the officer record is hydrated, since
        // we need its external ID
        await this.populateCaseload();
      },
    });
  }

  /**
   * Provide access to all configured metrics.
   */
  get metricConfigsById() {
    return this.supervisionStore.metricConfigsById;
  }

  /**
   * Fetch record for current officer.
   */
  protected *populateSupervisionOfficer(): FlowMethod<
    InsightsAPI["supervisionOfficer"],
    void
  > {
    if (this.isOfficerPopulated) return;
    this.fetchedOfficerRecord =
      yield this.supervisionStore.insightsStore.apiClient.supervisionOfficer(
        this.officerPseudoId,
      );
  }

  get isWorkflowsEnabled() {
    return (
      this.userStore.userAllowedNavigation?.workflows?.length &&
      !!this.userStore.activeFeatureVariants.supervisorHomepageWorkflows
    );
  }

  private expectClientsPopulated() {
    if (this.isWorkflowsEnabled && !this.clients)
      throw new Error("Failed to populate clients");
  }

  private async populateCaseload() {
    if (!this.isWorkflowsEnabled || !this.officerExternalId) return;
    await flowResult(
      this.justiceInvolvedPersonsStore.populateCaseloadForSupervisionOfficer(
        this.officerExternalId,
      ),
    );

    this.justiceInvolvedPersonsStore.caseloadByOfficerExternalId
      .get(this.officerExternalId)
      ?.forEach((client) =>
        Object.values(client.potentialOpportunities).forEach((opp) =>
          opp.hydrate(),
        ),
      );
  }

  get clients(): JusticeInvolvedPerson[] | undefined {
    if (!this.officerExternalId) return;
    return this.justiceInvolvedPersonsStore.caseloadByOfficerExternalId.get(
      this.officerExternalId,
    );
  }

  get numClientsOnCaseload(): number | undefined {
    return this.clients?.length;
  }

  get numEligibleOpportunities(): number | undefined {
    return this.clients?.reduce(
      (totalNum, client) =>
        Object.keys(client.opportunitiesEligible).length + totalNum,
      0,
    );
  }

  get opportunitiesByType():
    | Record<OpportunityType, Opportunity[]>
    | undefined {
    return this.clients?.reduce(
      (oppsByType, client) => {
        Object.entries(client.opportunitiesEligible).forEach(([key, opp]) => {
          const oppList = oppsByType[key as OpportunityType];
          if (oppList) {
            oppList.push(opp);
          } else {
            oppsByType[key as OpportunityType] = [opp];
          }
        });
        return oppsByType;
      },
      {} as Record<OpportunityType, Opportunity[]>,
    );
  }

  /**
   * Initiates hydration for all data needed within this presenter class
   */
  async hydrate(): Promise<void> {
    return this.hydrator.hydrate();
  }

  get hydrationState() {
    return this.hydrator.hydrationState;
  }
}
