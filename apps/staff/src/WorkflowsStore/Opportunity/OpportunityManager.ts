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

import * as Sentry from "@sentry/react";
import { DocumentData } from "firebase/firestore";
import { intersection } from "lodash";
import { makeAutoObservable, runInAction, set } from "mobx";

import {
  OpportunityRecordBase,
  opportunitySchemaBase,
  OpportunityType,
} from "~datatypes";
import {
  compositeHydrationState,
  Hydratable,
  HydrationState,
  isHydrated,
} from "~hydration-utils";

import { FeatureGateError } from "../../errors";
import { RootStore } from "../../RootStore";
import { JusticeInvolvedPerson } from "../types";
import { OpportunityBase } from "./OpportunityBase";
import { opportunityConstructors } from "./opportunityConstructors";
import { OpportunityManagerInterface, OpportunityMapping } from "./types";

/**
 * Leverages the `Hydratable` interface to implement the hydration infrastructure
 * for a person's opportunities, which are instantiated with the corresponding
 * Firestore documents. The `activeOpportunityTypes` reflects all of the types that
 * the we care about surfacing in the webtool, thus `hydrate` and `hydrationState`
 * take these values into account.
 */
export class OpportunityManager<PersonType extends JusticeInvolvedPerson>
  implements OpportunityManagerInterface
{
  // The opportunity types the manager is told to care about from an external source
  private selectedOpportunityTypes: OpportunityType[] = [];

  // The opportunity types that have failed to instantiate
  private failedOpportunityTypes: Set<OpportunityType> = new Set();

  // When the OpportunityManager is hydrated, this should mean that this mapping
  // contains the hydrated opportunities for all the active opportunity types
  opportunityMapping: OpportunityMapping = {};

  private hydrationStarted = false;

  constructor(
    private rootStore: RootStore,
    private person: PersonType,
    private eligibleOpportunityTypes: OpportunityType[],
  ) {
    makeAutoObservable(this);

    this.setSelectedOpportunityTypes([...this.incomingOpportunityTypes]);
  }

  private get enabledOpportunityTypes(): OpportunityType[] {
    return this.rootStore.workflowsRootStore.opportunityConfigurationStore
      .enabledOpportunityTypes;
  }

  // The opportunity types that are enabled and that the person is eligible for
  private get incomingOpportunityTypes(): OpportunityType[] {
    return intersection(
      this.eligibleOpportunityTypes,
      this.enabledOpportunityTypes,
    ) as OpportunityType[];
  }

  setSelectedOpportunityTypes(opportunityTypes: OpportunityType[]): void {
    runInAction(() => (this.selectedOpportunityTypes = opportunityTypes));
  }

  // The opportunity types that we expect the manager to be hydrated with
  private get activeOpportunityTypes() {
    return this.selectedOpportunityTypes.filter(
      (oppType) =>
        this.incomingOpportunityTypes.includes(oppType) &&
        !this.failedOpportunityTypes.has(oppType),
    );
  }

  async hydrate(): Promise<void> {
    runInAction(() => (this.hydrationStarted = true));
    // Instantiate the opportunities by type
    await Promise.all(
      this.activeOpportunityTypes.map(async (opportunityType) => {
        if (!(opportunityType in this.opportunityMapping))
          await this.instantiateOpportunitiesByType(opportunityType);
      }),
    );
  }

  async instantiateOpportunitiesByType(
    opportunityType: OpportunityType,
  ): Promise<void> {
    if (!this.rootStore.currentTenantId) return;

    // Get the constructor from the defined mapping of type to constructor
    const constructor = opportunityConstructors[opportunityType];

    // Get the collection name for the given opportunity type's records
    const opportunityTypeCollection =
      this.rootStore.workflowsRootStore.opportunityConfigurationStore
        .opportunities[opportunityType].firestoreCollection;

    // Query for the records from Firestore using the collection name, person, and state
    const records: DocumentData[] =
      await this.rootStore.firestoreStore.getOpportunitiesForJIIAndOpportunityType(
        this.person.externalId,
        opportunityTypeCollection,
        this.rootStore.currentTenantId,
      );

    const oppList: InstanceType<typeof constructor>[] = [];

    records.map(async (record) => {
      // Create an instance of the opportunity for the given record.
      let opp;
      try {
        opp = constructor
          ? new constructor(this.person as any, record)
          : new OpportunityBase<JusticeInvolvedPerson, OpportunityRecordBase>(
              this.person,
              opportunityType,
              this.rootStore,
              opportunitySchemaBase.parse(record),
            );
      } catch (e) {
        // don't log routine feature flag checks, but do log everything else
        if (!(e instanceof FeatureGateError)) {
          Sentry.captureException(e);
        }

        return;
      }

      // Hydrate the opportunity instance, i.e. instantiate the subscriptions to Firestore
      opp.hydrate();
      oppList.push(opp as InstanceType<typeof constructor>);
    });

    if (oppList.length > 0) {
      runInAction(() => {
        // If the opportunity type has previously failed, remove this type
        // from the failures.
        this.failedOpportunityTypes.delete(opportunityType);

        set(this.opportunityMapping, opportunityType, oppList);
      });
    } else {
      // If we couldn't instantiate any opportunities of this type,
      // mark as failed so that we don't leave the loading state hanging
      // or keep retrying forever
      runInAction(() => this.failedOpportunityTypes.add(opportunityType));
    }
  }

  get hydrationState(): HydrationState {
    if (!this.hydrationStarted && this.activeOpportunityTypes.length)
      return { status: "needs hydration" };
    return compositeHydrationState(
      this.activeOpportunityTypes.flatMap(
        (type) =>
          this.opportunityMapping[type] ??
          ({ hydrationState: { status: "loading" } } as Hydratable),
      ),
    );
  }

  get opportunities(): OpportunityMapping {
    return isHydrated(this)
      ? Object.fromEntries(
          Object.entries(this.opportunityMapping).filter(([key]) =>
            this.activeOpportunityTypes.includes(key as OpportunityType),
          ),
        )
      : {};
  }
}
