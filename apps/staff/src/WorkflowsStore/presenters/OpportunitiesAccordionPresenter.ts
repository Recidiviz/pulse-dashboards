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

import * as Sentry from "@sentry/react";
import { sortBy } from "lodash";
import { makeAutoObservable, reaction } from "mobx";

import {
  OpportunityRecordBase,
  opportunitySchemaBase,
  OpportunityType,
} from "~datatypes";
import {
  compositeHydrationState,
  Hydratable,
  HydratesFromSource,
  HydrationState,
} from "~hydration-utils";

import { FeatureGateError } from "../../errors";
import { Opportunity, OpportunityMapping } from "../Opportunity";
import { OpportunityBase } from "../Opportunity/OpportunityBase";
import { opportunityConstructors } from "../Opportunity/opportunityConstructors";
import { JusticeInvolvedPerson } from "../types";
import { WorkflowsStore } from "../WorkflowsStore";

export class OpportunitiesAccordionPresenter<
  PersonType extends JusticeInvolvedPerson,
> implements Hydratable
{
  private hydrator: HydratesFromSource;

  /**
   * Successfully instantiated opportunities by opportunity type.
   */
  private ineligibleOpportunityMapping: OpportunityMapping = {};

  constructor(
    private workflowsStore: WorkflowsStore,
    public person: PersonType,
    public hideEmpty = false,
    public formLinkButton = false,
    /**
     * Whether to show ineligible opportunities in the accordion.
     */
    public showIneligibleOpportunities = false,
  ) {
    reaction(
      () => workflowsStore.opportunityTypes,
      (opportunityTypes) => {
        person.opportunityManager.setSelectedOpportunityTypes(opportunityTypes);
      },
    );

    this.hydrator = new HydratesFromSource({
      populate: async () => {
        await this.populateIneligibleOpportunities();
      },
      expectPopulated: [() => this.expectIneligibleOpportunities()],
    });

    makeAutoObservable(this, undefined, { autoBind: true });
  }

  get opportunityConfigurations() {
    return this.workflowsStore.opportunityConfigurationStore?.opportunities;
  }

  private get ineligibleOpportunityTypes() {
    return this.showIneligibleOpportunities
      ? this.person.opportunityManager.ineligibleOpportunityTypes
      : [];
  }

  /**
   * Hydrated opportunities to display in the accordion, sorted by homepage position.
   */
  get opportunitiesToDisplayInAccordion() {
    return sortBy(
      Object.values({
        ...this.person.opportunityManager.opportunities,
        ...this.ineligibleOpportunityMapping,
      }).flat(),
      (opportunity) => opportunity?.config.homepagePosition,
    ) as Opportunity[];
  }

  get selectedOpportunityOnFullProfile() {
    return this.workflowsStore.selectedOpportunityOnFullProfile;
  }

  updateSelectedOpportunityOnFullProfile(
    ...params: Parameters<
      WorkflowsStore["updateSelectedOpportunityOnFullProfile"]
    >
  ) {
    return this.workflowsStore.updateSelectedOpportunityOnFullProfile(
      ...params,
    );
  }

  async hydrate() {
    return await Promise.allSettled([
      await this.person.opportunityManager.hydrate(),
      await this.hydrator.hydrate(),
    ]);
  }

  /**
   * The hydration state of the presenter, which is based on whether all opportunity types to display in the accordion have been populated.
   */
  get hydrationState(): HydrationState {
    return compositeHydrationState([
      this.person.opportunityManager,
      ...(this.showIneligibleOpportunities
        ? [
            this.hydrator,
            ...Object.values(this.ineligibleOpportunityMapping).flat(),
          ]
        : []),
    ]);
  }

  expectIneligibleOpportunities() {
    if (!this.showIneligibleOpportunities) return;

    const errors: Error[] = [];

    // Validate that all ineligible opportunities have been hydrated
    for (const ineligibleOpportunityType of this.ineligibleOpportunityTypes) {
      if (!(ineligibleOpportunityType in this.ineligibleOpportunityMapping))
        errors.push(
          new Error(
            `No opportunities found for type ${ineligibleOpportunityType}`,
          ),
        );
    }

    if (errors.length) throw new AggregateError(errors);
  }

  private updateOpportunityMapping(
    opportunityType: OpportunityType,
    opportunities: Opportunity[],
  ) {
    const { ineligibleOpportunityMapping } = this;
    if (opportunityType in ineligibleOpportunityMapping)
      ineligibleOpportunityMapping[opportunityType]?.push(
        // @ts-expect-error [TS2345] - already checked above that opportunityType exists in ineligibleOpportunityMapping
        ...opportunities,
      );
    // @ts-expect-error [TS2345] - already checked above that opportunityType exists in ineligibleOpportunityMapping
    else ineligibleOpportunityMapping[opportunityType] = opportunities;
  }

  /**
   * Populates the opportunityMapping with the person's ineligible opportunities.
   * Uses nested Promise.allSettled to handle failures gracefully at both levels:
   *
   * - INNER: per-opportunity instantiation within each type
   * - OUTER: per-opportunity-type fetching across all types
   */
  async populateIneligibleOpportunities() {
    if (!this.showIneligibleOpportunities) return;

    const { ineligibleOpportunityTypes, ineligibleOpportunityMapping } = this;

    // OUTER: Concurrently fetch and instantiate all ineligible opportunity types
    return Promise.allSettled(
      ineligibleOpportunityTypes.map(async (ineligibleOpportunityType) => {
        // INNER: Fetch and instantiate all opportunities for this opportunity type
        return await this.fetchAndInstantiateIneligibleOpportunityType(
          ineligibleOpportunityType,
        );
      }),
    ).then(
      // OUTER RESULT HANDLING
      (resultsForAllOpportunityTypes) => {
        const missingOpportunityTypes = ineligibleOpportunityTypes.filter(
          (t) => !(t in ineligibleOpportunityMapping),
        );
        if (!missingOpportunityTypes.length) return;
        const errors = resultsForAllOpportunityTypes
          .filter((result) => result.status === "rejected")
          .map(({ reason }) => reason);
        throw new AggregateError(
          errors,
          `Expected ineligible opportunity types ${ineligibleOpportunityTypes.join(", ")} to be hydrated, but failed to hydrate some ineligible opportunity types: ${missingOpportunityTypes.join(", ")}`,
        );
      },
    );
    // OUTER END
  }

  private async fetchAndInstantiateIneligibleOpportunityType(
    ineligibleOpportunityType: OpportunityType,
  ) {
    const { supportsIneligible, firestoreCollection } =
      this.opportunityConfigurations[ineligibleOpportunityType];

    if (!supportsIneligible)
      return this.updateOpportunityMapping(ineligibleOpportunityType, []);

    const fetchedIneligibleOpportunityRecords =
      await this.workflowsStore.rootStore.firestoreStore.getOpportunitiesForJIIAndOpportunityType(
        this.person.externalId,
        firestoreCollection,
        this.person.stateCode,
        {
          includeIneligible: true,
        },
      );

    if (fetchedIneligibleOpportunityRecords.length === 0)
      return this.updateOpportunityMapping(ineligibleOpportunityType, []);

    // Concurrently instantiate all opportunities for this opportunity type
    return Promise.allSettled(
      fetchedIneligibleOpportunityRecords.map((record) => {
        // Instantiate the opportunity using the appropriate constructor
        const constructor = opportunityConstructors[ineligibleOpportunityType];
        return constructor
          ? new constructor(
              // @ts-expect-error [TS2345] - PersonType extends JusticeInvolvedPerson but constructor expects specific Resident/Client type
              this.person,
              record,
              ineligibleOpportunityType,
            )
          : new OpportunityBase<JusticeInvolvedPerson, OpportunityRecordBase>(
              this.person,
              ineligibleOpportunityType,
              this.workflowsStore.rootStore,
              opportunitySchemaBase.parse(record),
            );
      }),
    ).then((resultsForOpportunityType) => {
      const { opportunities } = resultsForOpportunityType.reduce(
        (processed, result) => {
          if (result.status === "fulfilled") {
            if (result.value) processed.opportunities.push(result.value);
            return processed;
          }

          if (!(result.reason instanceof FeatureGateError)) {
            // don't log routine feature flag checks, but do log everything else
            Sentry.captureException(result.reason);
          }
          return processed;
        },
        { opportunities: [] as Opportunity[] },
      );

      if (opportunities.length === 0) return;
      else {
        opportunities.forEach((o) => o.hydrate());
        this.updateOpportunityMapping(ineligibleOpportunityType, opportunities);
      }
    });
  }
}
