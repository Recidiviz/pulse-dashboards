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
import { FilterParams } from "~firestore-api";
import { FlowMethod } from "~hydration-utils";

import { DataAPI } from "../apis/data/interface";
import { residentEligibilityReportConstructors } from "../configs/residentEligibilityReportConstructors";
import {
  IncarcerationOpportunityId,
  OpportunityRecord,
  ResidentsConfig,
} from "../configs/types";
import { EligibilityReport } from "../models/EligibilityReport/interface";
import type { RootStore } from "./RootStore";

// because we use a mapped type to ensure key-value agreement, this can't be an ES6 Map
type OpportunityRecordMapping = {
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
  residentOpportunityRecordsByExternalId: Map<
    string,
    OpportunityRecordMapping
  > = new Map();

  residentEligibilityReportsByExternalId: Map<
    string,
    Map<IncarcerationOpportunityId, EligibilityReport>
  > = new Map();

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

  get opportunityIdsByUrlSlug(): Map<string, IncarcerationOpportunityId> {
    return new Map(
      Object.entries(this.config.incarcerationOpportunities).map(
        ([id, config]) => {
          return [
            config.urlSlug,
            id as keyof typeof this.config.incarcerationOpportunities,
          ];
        },
      ),
    );
  }

  /**
   * Get a convenient non-nullable ID value; accepts any string,
   * so you should be confident you have a valid slug or be prepared to handle an error.
   */
  opportunitySlugToIdOrThrow(slug: string) {
    const id = this.opportunityIdsByUrlSlug.get(slug);
    if (!id) {
      throw new Error(`No opportunity ID matches url segment ${slug}`);
    }
    return id;
  }

  areAllResidentsPopulated(): boolean {
    // if we started the session on a single resident's page, we might have had one
    // populated already. Seems a safe assumption that the total will always be > 1
    return this.residentsByExternalId.size > 1;
  }
  /**
   * Populates {@link residentsByExternalId} with the API response for all available residents.
   * Will not refetch if data is already populated, unless `forceRefresh` is true
   */
  *populateResidents(
    filters?: Array<FilterParams>,
    forceRefresh = false,
  ): FlowMethod<DataAPI["residents"], void> {
    if (!forceRefresh && this.areAllResidentsPopulated()) return;

    const residents = yield this.apiClient.residents(filters);
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

  get residentsByPseudoId(): Map<string, ResidentRecord["output"]> {
    return new Map(
      Object.entries(
        keyBy([...this.residentsByExternalId.values()], "pseudonymizedId"),
      ),
    );
  }

  isResidentWithPseudoIdPopulated(pseudoId: string): boolean {
    return this.residentsByPseudoId.has(pseudoId);
  }

  /**
   * Populates {@link residentsByExternalId} with the API response for the resident
   * with pseudonymizedId matching `residentPseudoId`. Throws if the API request fails.
   * Will not refetch if data is already populated.
   */
  *populateResidentByPseudoId(
    residentPseudoId: string,
  ): FlowMethod<DataAPI["residentById"], void> {
    if (this.isResidentWithPseudoIdPopulated(residentPseudoId)) return;

    const resident = yield this.apiClient.residentByPseudoId(residentPseudoId);
    this.residentsByExternalId.set(resident.personExternalId, resident);
  }

  isResidentEligibilityRecordPopulated(
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
      residentExternalId,
      opportunityId,
    );
    const opportunityMap: OpportunityRecordMapping =
      this.residentOpportunityRecordsByExternalId.get(residentExternalId) ?? {};

    opportunityMap[opportunityId] = eligibilityRecord;

    if (!this.residentOpportunityRecordsByExternalId.has(residentExternalId)) {
      this.residentOpportunityRecordsByExternalId.set(
        residentExternalId,
        opportunityMap,
      );
    }
  }

  isResidentEligibilityReportPopulated(
    residentExternalId: string,
    opportunityId: IncarcerationOpportunityId,
  ): boolean {
    return !!this.residentEligibilityReportsByExternalId
      .get(residentExternalId)
      ?.has(opportunityId);
  }

  /**
   * Populates {@link residentEligibilityReportsByExternalId} with an {@link EligibilityReport} object
   * for the given resident and opportunity, if it does not already exist.
   */
  populateEligibilityReportFromData<OppId extends IncarcerationOpportunityId>(
    opportunityId: OppId,
    resident: ResidentRecord["output"],
    opportunity: OpportunityRecord<OppId> | undefined,
  ) {
    const residentExternalId = resident.personExternalId;

    if (
      this.isResidentEligibilityReportPopulated(
        residentExternalId,
        opportunityId,
      )
    ) {
      return;
    }

    const config = this.config.incarcerationOpportunities[opportunityId];

    if (!config) {
      throw new Error(`Opportunity ${opportunityId} is not configured`);
    }

    const ReportConstructor =
      residentEligibilityReportConstructors[opportunityId];

    const mapping =
      this.residentEligibilityReportsByExternalId.get(residentExternalId) ??
      new Map();

    mapping.set(
      opportunityId,
      new ReportConstructor(resident, config, opportunity),
    );
    if (!this.residentEligibilityReportsByExternalId.has(residentExternalId)) {
      this.residentEligibilityReportsByExternalId.set(
        residentExternalId,
        mapping,
      );
    }
  }

  get stateCode() {
    return this.userStore.stateCode;
  }
}
