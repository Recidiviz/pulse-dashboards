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

import keyBy from "lodash/keyBy";
import { makeAutoObservable, set } from "mobx";

import { ResidentRecord } from "~datatypes";
import { FlowMethod } from "~hydration-utils";

import { DataAPI } from "../api/interface";
import {
  IncarcerationOpportunityId,
  OpportunityRecord,
  ResidentsConfig,
} from "../configs/types";
import type { RootStore } from "./RootStore";

// because we use a mapped type to ensure key-value agreement, this can't be an ES6 Map
type EligibilityMap = {
  [O in IncarcerationOpportunityId]?: OpportunityRecord<O>;
};

export class ResidentsStore {
  /**
   * Holds all resident records that have been fetched
   */
  residentsByExternalId: Map<string, ResidentRecord["output"]> = new Map();

  /**
   * Holds all opportunity eligibility records that have been fetched
   */
  residentEligibilityRecordsByExternalId: Map<string, EligibilityMap> =
    new Map();

  constructor(
    private readonly rootStore: RootStore,
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

  get opportunityIdsByUrl(): Map<string, IncarcerationOpportunityId> {
    return new Map(
      Object.entries(this.config.incarcerationOpportunities).map(
        ([id, config]) => {
          return [
            config.urlSection,
            id as keyof typeof this.config.incarcerationOpportunities,
          ];
        },
      ),
    );
  }

  areAllResidentsPopulated(): boolean {
    // if we started the session on a single resident's page, we might have had one
    // populated already. Seems a safe assumption that the total will always be > 1
    return this.residentsByExternalId.size > 1;
  }
  /**
   * Populates {@link residentsByExternalId} with the API response for all available residents.
   * Will not refetch if data is already populated.
   */
  *populateAllResidents(): FlowMethod<DataAPI["residents"], void> {
    if (this.areAllResidentsPopulated()) return;

    const residents = yield this.apiClient.residents();
    set(this.residentsByExternalId, keyBy(residents, "personExternalId"));
  }

  isResidentPopulated(residentExternalId: string): boolean {
    return this.residentsByExternalId.has(residentExternalId);
  }
  /**
   * Populates {@link residentsByExternalId} with the API response for the resident
   * with personExternalId matching `residentExternalId`. Throws if the API request fails.
   * Will not refetch if data is already populated.
   */
  *populateResidentById(
    residentExternalId: string,
  ): FlowMethod<DataAPI["residentById"], void> {
    if (this.isResidentPopulated(residentExternalId)) return;

    const resident = yield this.apiClient.residentById(residentExternalId);
    this.residentsByExternalId.set(resident.personExternalId, resident);
  }

  isResidentEligibilityPopulated(
    residentExternalId: string,
    opportunityId: IncarcerationOpportunityId,
  ): boolean {
    return (
      opportunityId in
      (this.residentEligibilityRecordsByExternalId.get(residentExternalId) ??
        {})
    );
  }

  /**
   * Populates {@link residentEligibilityRecordsByExternalId} with the API response for
   * the provided resident and opportunity IDs. Will populate with `undefined` if no record is found
   * (indicating the resident is ineligible). Will not refetch if data is already populated.
   */
  *populateEligibilityRecordByResidentId(
    residentExternalId: string,
    opportunityId: IncarcerationOpportunityId,
  ): FlowMethod<DataAPI["residentEligibility"], void> {
    if (this.isResidentEligibilityPopulated(residentExternalId, opportunityId))
      return;

    const eligibilityRecord = yield this.apiClient.residentEligibility(
      residentExternalId,
      opportunityId,
    );
    const opportunityMap: EligibilityMap =
      this.residentEligibilityRecordsByExternalId.get(residentExternalId) ?? {};

    opportunityMap[opportunityId] = eligibilityRecord;

    if (!this.residentEligibilityRecordsByExternalId.has(residentExternalId)) {
      this.residentEligibilityRecordsByExternalId.set(
        residentExternalId,
        opportunityMap,
      );
    }
  }
}
