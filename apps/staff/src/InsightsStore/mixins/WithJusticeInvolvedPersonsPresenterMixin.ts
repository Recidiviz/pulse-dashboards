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

import { flowResult } from "mobx";

import { OpportunityType } from "~datatypes";
import { awaitHydration, Hydratable, isHydrated } from "~hydration-utils";

import { JusticeInvolvedPerson, Opportunity } from "../../WorkflowsStore";
import { JusticeInvolvedPersonsStore } from "../../WorkflowsStore/JusticeInvolvedPersonsStore";
import { SupervisionBasePresenter } from "../presenters/SupervisionBasePresenter";
import {
  ConstrainedAbstractConstructor,
  JusticeInvolvedPersonOpportunityMapping,
} from "./types";

/**
 * This requires that a class object using the `WithJusticeInvolvedPersonStoreMixin`
 * contains the following properties below.
 */
type SupervisionBasePresenterWithHydratable =
  ConstrainedAbstractConstructor<SupervisionBasePresenter>;

export type PersonHydratableField = {
  [K in keyof JusticeInvolvedPerson]: Required<JusticeInvolvedPerson>[K] extends Hydratable
    ? K
    : never;
}[keyof JusticeInvolvedPerson] &
  string;

/**
 * This is a mixin ({@Link https://www.typescriptlang.org/docs/handbook/mixins.html}) that adds methods to a class
 * that needs access to a `JusticeInvolvedPersonsStore`. It's especially useful when you need to extend more than one class.
 * @param Base - The base class to extend.
 * @returns A new class that extends the base class with additional methods.
 * @template Presenter - A base class that extends hydratable and has the required methods.
 * @see {JusticeInvolvedPersonsStore}
 * @see {SupervisionBasePresenter}
 *
 */
export function WithJusticeInvolvedPersonStore<
  Presenter extends SupervisionBasePresenterWithHydratable,
>(Base: Presenter) {
  abstract class BasePresenterWithJusticeInvolvedPersonsStore extends Base {
    /**
     * The store for justice involved persons.
     * @type {JusticeInvolvedPersonsStore}
     */
    protected justiceInvolvedPersonsStore:
      | JusticeInvolvedPersonsStore
      | undefined;

    private _opportunityMapping: JusticeInvolvedPersonOpportunityMapping =
      "opportunities";

    protected personFieldsToHydrate: PersonHydratableField[] = [];

    /**
     * Checks if workflows are enabled based on user permissions.
     * @returns `true` if workflows are enabled, otherwise `false`.
     */
    get isWorkflowsEnabled() {
      const { userStore } = this.supervisionStore.insightsStore.rootStore;

      // Check if...
      return (
        // ...the user has allowed navigation to workflows and...
        userStore.getRoutePermission("workflowsSupervision") &&
        // ...if the active feature variant for supervisorHomepageWorkflows is enabled.
        !!userStore.activeFeatureVariants.supervisorHomepageWorkflows
      );
    }

    get opportunityMapping(): JusticeInvolvedPersonOpportunityMapping {
      return this._opportunityMapping;
    }

    set opportunityMapping(
      opportunityMapping: JusticeInvolvedPersonOpportunityMapping,
    ) {
      this._opportunityMapping = opportunityMapping;
    }

    /**
     * Finds all persons assigned to a given officer.
     * @param officerExternalId - The external ID of the officer to look up persons.
     * @returns An array of persons assigned to the officer or an empty array if none found.
     * @see {JusticeInvolvedPerson}
     */
    protected findClientsForOfficer(
      officerExternalId: string,
    ): JusticeInvolvedPerson[] | undefined {
      // Return the list of persons or undefined if no persons found
      return this.justiceInvolvedPersonsStore?.caseloadByOfficerExternalId.get(
        officerExternalId,
      );
    }

    // TODO (#5994): this field appears to briefly remain empty, even after hydration
    // completes.
    /**
     * Finds verified opportunities (eligible, almost eligible, overridden) for all
     * clients assigned to a given officer, grouped by opportunity type.
     * @param officerExternalId - The external ID of the officer to look up opportunities.
     * @returns An object with lists of opportunities assigned to keys of the same type.
     * @see {Opportunity}
     * @see {OpportunityType}
     */
    protected opportunitiesByTypeForOfficer(
      officerExternalId: string,
      opportunityMappingOverride?: JusticeInvolvedPersonOpportunityMapping,
    ): Record<OpportunityType, Opportunity[]> | undefined {
      // Get the list of clients assigned to the officer
      const clients = this.findClientsForOfficer(officerExternalId);
      // Group opportunities by type for each client

      const opportunitiesByType = clients?.reduce(
        (oppsByType, client) => {
          for (const opportunity of Object.values(
            client[opportunityMappingOverride ?? this.opportunityMapping],
          ).flat()) {
            const { type } = opportunity;
            // Initialize the array for the opportunity type if it doesn't exist and then push the opportunity to the array
            (oppsByType[type] ?? (oppsByType[type] = [])).push(opportunity);
          }

          return oppsByType as Record<OpportunityType, Opportunity[]>;
        },
        {} as Record<OpportunityType, Opportunity[]>,
      );

      // Return the grouped opportunities
      return opportunitiesByType;
    }

    /**
     * Counts the number of verified opportunities (eligible, almost eligible, overridden)
     * for clients assigned to a given officer.
     * @param officerExternalId - The external ID of the officer to count opportunities for.
     * @returns The number of verified opportunities for clients assigned to the officer.
     */
    protected countOpportunitiesForOfficer(
      officerExternalId: string | undefined,
      opportunityMappingOverride?: JusticeInvolvedPersonOpportunityMapping,
    ): number | undefined {
      return officerExternalId !== undefined
        ? this.findClientsForOfficer(officerExternalId)?.reduce(
            (acc, client) =>
              (acc += Object.values(
                client[opportunityMappingOverride ?? this.opportunityMapping],
              ).length),
            0,
          )
        : undefined;
    }

    /**
     * Populate the caseload map for this officer.
     * @param officerExternalId - External ID of the relevant officer.
     */
    async populateCaseloadForOfficer(officerExternalId: string) {
      if (!this.justiceInvolvedPersonsStore) return;

      await flowResult(
        this.justiceInvolvedPersonsStore.populateCaseloadForSupervisionOfficer(
          officerExternalId,
        ),
      );

      const clients = this.findClientsForOfficer(officerExternalId);
      if (!clients) return;
      const hydrations: Promise<void>[] = [];

      for (const client of clients) {
        for (const field of this.personFieldsToHydrate) {
          if (client[field]) hydrations.push(awaitHydration(client[field]));
        }
      }

      return await Promise.all(hydrations);
    }

    /**
     * If workflows are enabled, this method will throw an error if the clients are not populated for the officer.
     * @protected
     * @param officerExternalId
     */
    protected expectCaseloadPopulated(officerExternalId: string | undefined) {
      if (!this.isWorkflowsEnabled) return;

      if (!officerExternalId)
        throw new Error("Officer `externalId` is undefined.");

      const clients = this.findClientsForOfficer(officerExternalId);

      if (!clients)
        throw new Error(
          `Failed to populate clients for externalId ${officerExternalId}`,
        );

      for (const client of clients) {
        for (const field of this.personFieldsToHydrate) {
          if (!client[field] || !isHydrated(client[field])) {
            throw new Error(
              `Failed to populate ${field} for client ${client.externalId} of officer ${officerExternalId}`,
            );
          }
        }
      }
    }
  }
  return BasePresenterWithJusticeInvolvedPersonsStore;
}
