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
import {
  awaitHydration,
  HydratesFromSource,
  isHydrated,
} from "~hydration-utils";

import { Page } from "../../core/InsightsSupervisorPage/InsightsBreadcrumbs";
import {
  JusticeInvolvedPerson,
  Opportunity,
  WorkflowsStore,
} from "../../WorkflowsStore";
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
    private workflowsStore?: WorkflowsStore,
  ) {
    super(
      supervisionStore,
      supervisorPseudoId,
      justiceInvolvedPersonsStore,
      opportunityConfigurationStore,
    );

    makeObservable<
      SupervisionSupervisorOpportunityPresenter,
      "expectSupervisorPopulated" | "expectStaffRosterPopulated"
    >(this, {
      opportunityType: true,
      opportunities: true,
      // hydration
      hydrate: override,
      hydrationState: override,
      expectSupervisorPopulated: override,
      expectStaffRosterPopulated: true,
    });

    this.hydrator = new HydratesFromSource({
      populate: async () => {
        await Promise.all([
          // TODO(OBT-OBT-39307) Improve hydration while impersonating
          this.workflowsStore
            ? awaitHydration(
                this.workflowsStore
                  .supervisionStaffWithOrWithoutCaseloadSubscription,
              )
            : Promise.resolve(),
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
        await this.populateCaseloadForCurrentReviewer();
      },
      expectPopulated: [
        this.expectSupervisorPopulated,
        this.expectStaffRosterPopulated,
        this.expectOfficersPopulated,
        this.expectOpportunityConfigurationStorePopulated,
        ...this.allOfficers.map(
          (o) => () => this.expectCaseloadPopulated(o.externalId),
        ),
        () =>
          this.expectCaseloadPopulatedForReviewer(
            this.supervisorInfo?.externalId,
          ),
      ],
    });
  }

  /**
   * Asserts that the officer roster (including officers without a caseload)
   * has been hydrated, so officer names (e.g. the current reviewer) can be
   * resolved. A missing `workflowsStore` is not an error on its own (e.g. no
   * caller wired one up) and is a no-op.
   */
  private expectStaffRosterPopulated() {
    if (!this.workflowsStore || !this.isInsightsSupervisorReviewTableEnabled)
      return;

    if (
      !isHydrated(
        this.workflowsStore.supervisionStaffWithOrWithoutCaseloadSubscription,
      )
    ) {
      throw new Error("Failed to populate officer roster");
    }
  }

  // All opportunities for the officers of this supervisor
  // If isInsightsSupervisorReviewTableEnabled is true, all opportunities
  // awaiting review from this supervisor
  get opportunitiesByType(): Record<OpportunityType, Opportunity[]> {
    if (this.isInsightsSupervisorReviewTableEnabled) {
      const { externalId } = this.supervisorInfo ?? {};
      if (!externalId) return {} as Record<OpportunityType, Opportunity[]>;
      return this.opportunitiesByTypeForReviewer(externalId);
    }

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
    const clients = [];

    if (this.isInsightsSupervisorReviewTableEnabled) {
      const { externalId } = this.supervisorInfo ?? {};
      const clientsForReviewer = externalId
        ? this.findClientsForReviewer(externalId)
        : undefined;
      if (clientsForReviewer) {
        clients.push(...clientsForReviewer);
      }
    } else {
      const clientsForOfficer = this.allOfficers.reduce((acc, officer) => {
        const clientsForOfficer = this.findClientsForOfficer(
          officer.externalId,
        );
        if (clientsForOfficer) {
          acc = acc.concat(clientsForOfficer);
        }
        return acc;
      }, [] as JusticeInvolvedPerson[]);
      clients.push(...clientsForOfficer);
    }

    return clients;
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

  get userCanAccessAllSupervisors() {
    return this.supervisionStore.userCanAccessAllSupervisors;
  }
}
