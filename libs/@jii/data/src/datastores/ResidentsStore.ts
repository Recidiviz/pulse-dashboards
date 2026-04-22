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

import { captureException } from "@sentry/react";
import { parseISO } from "date-fns";
import keyBy from "lodash/keyBy";
import omit from "lodash/omit";
import { makeAutoObservable, runInAction, set } from "mobx";

import { StateCode } from "~@jii/configs";
import { IncarcerationOpportunityId, ResidentsConfig } from "~@jii/configs";
import type { JiiResidentAppRouterOutputs } from "~@jii/trpc-types";
import { LocationRecord, ResidentRecord } from "~datatypes";
import { FilterParams } from "~firestore-api";
import { FlowMethod } from "~hydration-utils";

import { DataAPI } from "../apis/data/interface";
import { OpportunityRecord } from "../configs/residentsOpportunitySchemas";
import type { RootStore } from "./RootStore";

// because we use a mapped type to ensure key-value agreement, this can't be an ES6 Map
type OpportunityRecordMapping = {
  [O in IncarcerationOpportunityId]?: OpportunityRecord<O>;
};

export type StateUserProperties =
  JiiResidentAppRouterOutputs["user"]["getProperties"];

// these are legacy keys from when properties were kept in local storage.
// we still support them but only to incrementally migrate them to the backend
type UserPropertyKey = "egtOnboardingSeen" | "azOnboardingSeen";

export type ResidentFlags = JiiResidentAppRouterOutputs["resident"]["getFlags"];

export class ResidentsStore {
  /**
   * Holds all resident records that have been fetched
   */
  residentsByExternalId: Map<string, ResidentRecord> = new Map();

  /**
   * Holds all opportunity eligibility records that have been fetched
   */
  residentOpportunityRecordsByExternalId: Map<
    string,
    OpportunityRecordMapping
  > = new Map();

  locations: Array<LocationRecord> = [];

  residentFlagsByPseudoId: Map<string, ResidentFlags> = new Map();

  userProperties?: StateUserProperties;

  constructor(
    private readonly rootStore: RootStore,
    public readonly stateCode: StateCode,
    public readonly config: ResidentsConfig,
  ) {
    makeAutoObservable(this);
  }

  private get apiClient() {
    return this.rootStore.apiClient;
  }

  get userStore() {
    return this.rootStore.userStore;
  }

  private areAllResidentsPopulated(): boolean {
    // if we started the session on a single resident's page, we might have had one
    // populated already. Seems a safe assumption that the total will always be > 1
    return this.residentsByExternalId.size > 1;
  }
  /**
   * Populates {@link residentsByExternalId} with the API response for all available residents
   * (or the subset indicated by {@link filters}).
   * Will not refetch if data is already populated, unless `forceRefresh` is true
   */
  *populateResidents(
    filters?: Array<FilterParams>,
    forceRefresh = false,
  ): FlowMethod<DataAPI["residents"], void> {
    if (!forceRefresh && this.areAllResidentsPopulated()) return;

    const residents = yield this.apiClient.residents(this.stateCode, filters);
    set(this.residentsByExternalId, keyBy(residents, "personExternalId"));
  }

  /**
   * Populates {@link locations} with the API response for all available locations
   */
  *populateLocations(): FlowMethod<DataAPI["locations"], void> {
    this.locations = yield this.apiClient.locations(this.stateCode);
  }

  get residentsByPseudoId(): Map<string, ResidentRecord> {
    return new Map(
      Object.entries(
        keyBy([...this.residentsByExternalId.values()], "pseudonymizedId"),
      ),
    );
  }

  private isResidentWithPseudoIdPopulated(pseudoId: string): boolean {
    return this.residentsByPseudoId.has(pseudoId);
  }

  /**
   * Populates {@link residentsByExternalId} with the API response for the resident
   * with pseudonymizedId matching `residentPseudoId`. Throws if the API request fails.
   * Will not refetch if data is already populated.
   */
  *populateResidentByPseudoId(
    residentPseudoId: string,
  ): FlowMethod<DataAPI["residentByPseudoId"], void> {
    if (this.isResidentWithPseudoIdPopulated(residentPseudoId)) return;

    const resident = yield this.apiClient.residentByPseudoId(
      this.stateCode,
      residentPseudoId,
    );
    this.residentsByExternalId.set(resident.personExternalId, resident);
  }

  private isResidentEligibilityRecordPopulated(
    residentExternalId: string,
    opportunityId: IncarcerationOpportunityId,
  ): boolean {
    return (
      opportunityId in
      (this.residentOpportunityRecordsByExternalId.get(residentExternalId) ??
        {})
    );
  }

  /**
   * Populates {@link residentOpportunityRecordsByExternalId} with the API response for
   * the provided resident and opportunity IDs. Will populate with `undefined` if no record is found
   * (indicating the resident is ineligible). Will not refetch if data is already populated.
   */
  *populateOpportunityRecordByResidentId(
    residentExternalId: string,
    opportunityId: IncarcerationOpportunityId,
  ): FlowMethod<DataAPI["residentEligibility"], void> {
    if (
      this.isResidentEligibilityRecordPopulated(
        residentExternalId,
        opportunityId,
      )
    )
      return;

    const eligibilityRecord = yield this.apiClient.residentEligibility(
      this.stateCode,
      residentExternalId,
      opportunityId,
    );
    const opportunityMap: OpportunityRecordMapping =
      this.residentOpportunityRecordsByExternalId.get(residentExternalId) ?? {};

    //@ts-expect-error TypeScript can't verify that the opportunityId and eligibilityRecord types align here
    opportunityMap[opportunityId] = eligibilityRecord;

    if (!this.residentOpportunityRecordsByExternalId.has(residentExternalId)) {
      this.residentOpportunityRecordsByExternalId.set(
        residentExternalId,
        opportunityMap,
      );
    }
  }

  *populateResidentFlags(
    pseudoId: string,
  ): FlowMethod<typeof this.apiClient.trpc.resident.getFlags.query, void> {
    if (this.residentFlagsByPseudoId.has(pseudoId)) return;

    const flags = yield this.apiClient.trpc.resident.getFlags.query({
      pseudonymizedId: pseudoId,
    });

    this.residentFlagsByPseudoId.set(pseudoId, flags);
  }

  async populateUserProperties() {
    if (this.userProperties !== undefined) return;

    // state code is implicit in every query, so we don't need to specify it here
    let properties = await this.apiClient.trpc.user.getProperties.query();
    if (!properties?.hasSeenOnboarding) {
      const localStorageProperties =
        this.getAndMigrateOldLocalStorageProperties();
      if (localStorageProperties) {
        properties = { ...properties, ...localStorageProperties };
      }
    }

    runInAction(() => {
      this.userProperties = properties;
    });
  }

  // incrementally migrating old data from local storage as we encounter it
  private getAndMigrateOldLocalStorageProperties() {
    let onboardingFlag: string | null = null;
    let localProperty: UserPropertyKey | undefined;

    if (this.stateCode === "US_AZ") {
      localProperty = "azOnboardingSeen";
    } else if (this.stateCode === "US_MA") {
      localProperty = "egtOnboardingSeen";
    }

    if (localProperty) {
      onboardingFlag = localStorage.getItem(localProperty);

      if (onboardingFlag) {
        const hasSeenOnboarding = parseISO(onboardingFlag);

        // we're not awaiting this because it doesn't need to block UI
        this.apiClient.trpc.user.setProperties
          .mutate({ hasSeenOnboarding })
          .then(() => {
            localStorage.removeItem(localProperty);
          })
          .catch((e) => {
            captureException(e);
          });

        return { hasSeenOnboarding };
      }
    }
    return;
  }

  async setUserOnboardingSeen() {
    const seenTime = new Date();
    // set optimistically
    if (this.userProperties) {
      this.userProperties.hasSeenOnboarding = seenTime;
    } else {
      this.userProperties = { hasSeenOnboarding: seenTime };
    }

    try {
      const updatedProperties =
        await this.apiClient.trpc.user.setProperties.mutate({
          hasSeenOnboarding: seenTime,
        });
      // refresh properties again after server response
      runInAction(() => {
        this.userProperties = omit(updatedProperties, "id");
      });
    } catch {
      // it's OK for this to fail silently, it should be logged elsewhere.
      // only effect to user is that they'll see onboarding again next time
    }
  }
}
