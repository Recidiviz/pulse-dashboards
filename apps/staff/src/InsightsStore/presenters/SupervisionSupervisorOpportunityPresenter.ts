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

import { flowResult, makeObservable, override } from "mobx";

import { OpportunityType, SupervisionOfficerSupervisor } from "~datatypes";
import { HydratesFromSource } from "~hydration-utils";

import { Page } from "../../core/InsightsSupervisorPage/InsightsBreadcrumbs";
import { JusticeInvolvedPerson, Opportunity } from "../../WorkflowsStore";
import { JusticeInvolvedPersonsStore } from "../../WorkflowsStore/JusticeInvolvedPersonsStore";
import { OpportunityConfigurationStore } from "../../WorkflowsStore/Opportunity/OpportunityConfigurations/OpportunityConfigurationStore";
import { InsightsSupervisionStore } from "../stores/InsightsSupervisionStore";
import { SupervisionSupervisorOpportunitiesPresenter } from "./SupervisionSupervisorOpportunitiesPresenter";
import { getBreadcrumbsPages } from "./utils";

/**
 * A presenter for the supervisor opportunity page. We override the parent hydrator
 * because this presenter needs to guarantee the supervisor is populated.
 */
export class SupervisionSupervisorOpportunityPresenter extends SupervisionSupervisorOpportunitiesPresenter {
  constructor(
    supervisionStore: InsightsSupervisionStore,
    justiceInvolvedPersonsStore: JusticeInvolvedPersonsStore,
    opportunityConfigurationStore: OpportunityConfigurationStore,
    supervisorPseudoId: string,
    public opportunityType: OpportunityType,
  ) {
    super(
      supervisionStore,
      supervisorPseudoId,
      justiceInvolvedPersonsStore,
      opportunityConfigurationStore,
    );

    makeObservable<
      SupervisionSupervisorOpportunityPresenter,
      "expectSupervisorPopulated"
    >(this, {
      opportunityType: true,
      opportunities: true,
      // hydration
      hydrate: override,
      hydrationState: override,
      expectSupervisorPopulated: true,
    });

    this.hydrator = new HydratesFromSource({
      populate: async () => {
        await Promise.all([
          flowResult(
            this.supervisionStore.populateSupervisionOfficerSupervisors(),
          ),
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
        this.expectSupervisorPopulated,
        this.expectOfficersPopulated,
        this.expectOpportunityConfigurationStorePopulated,
        ...this.allOfficers.map(
          (o) => () => this.expectCaseloadPopulated(o.externalId),
        ),
      ],
    });
  }

  // All opportunities for the officers of this supervisor
  get opportunitiesByType(): Record<OpportunityType, Opportunity[]> {
    const oppsByType = this.allOfficers.reduce(
      (acc, officer) => {
        const oppsByTypeForOfficer = this.opportunitiesByTypeForOfficer(
          officer.externalId,
        );
        if (oppsByTypeForOfficer) {
          Object.entries(oppsByTypeForOfficer).forEach(([key, opps]) => {
            const oppType = key as OpportunityType;
            if (oppType in acc) {
              acc[oppType] = acc[oppType].concat(opps);
            } else {
              acc[oppType] = opps;
            }
          });
        }
        return acc;
      },
      {} as Record<OpportunityType, Opportunity[]>,
    );
    return oppsByType;
  }

  get opportunities(): Opportunity[] | undefined {
    return this.opportunitiesByType?.[this.opportunityType];
  }

  get previousPages(): Page[] {
    return getBreadcrumbsPages(
      this.userCanAccessAllSupervisors,
      this.labels,
      this.supervisorInfo,
    );
  }

  get opportunityLabel(): string {
    return this.opportunities?.[0].config.label ?? "";
  }

  get clients(): JusticeInvolvedPerson[] {
    return this.allOfficers.reduce((acc, officer) => {
      const clientsForOfficer = this.findClientsForOfficer(officer.externalId);
      if (clientsForOfficer) {
        acc = acc.concat(clientsForOfficer);
      }
      return acc;
    }, [] as JusticeInvolvedPerson[]);
  }

  get clientPseudoId() {
    return this.supervisionStore.clientPseudoId;
  }

  get client(): JusticeInvolvedPerson | undefined {
    return this.clients?.find(
      (client) => client.pseudonymizedId === this.clientPseudoId,
    );
  }

  get supervisorInfo(): SupervisionOfficerSupervisor | undefined {
    return this.supervisionStore.supervisorInfo(this.supervisorPseudoId);
  }

  private expectSupervisorPopulated() {
    if (!this.supervisorInfo)
      throw new Error("Failed to populate supervisor info");
  }

  get userCanAccessAllSupervisors() {
    return this.supervisionStore.userCanAccessAllSupervisors;
  }
}
