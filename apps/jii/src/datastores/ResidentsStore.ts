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

import { IncarcerationStaffRecord, ResidentRecord } from "~datatypes";
import { FlowMethod } from "~hydration-utils";

import { DataAPI } from "../api/interface";
import { ResidentsConfig } from "../configs/types";
import type { RootStore } from "./RootStore";

export class ResidentsStore {
  assignedStaffByExternalId: Map<string, IncarcerationStaffRecord["output"]> =
    new Map();

  residentsByExternalId: Map<string, ResidentRecord["output"]> = new Map();

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

  /**
   * Populates `this.residentsByExternalId` with the API response for all available residents.
   */
  *populateAllResidents(): FlowMethod<DataAPI["residents"], void> {
    const residents = yield this.apiClient.residents();
    set(this.residentsByExternalId, keyBy(residents, "personExternalId"));
  }

  /**
   * Populates `this.residentsByExternalId` with the API response for the resident
   * with personExternalId matching `residentExternalId`. Throws if the API request fails.
   */
  *populateResidentById(
    residentExternalId: string,
  ): FlowMethod<DataAPI["residentById"], void> {
    const resident = yield this.apiClient.residentById(residentExternalId);
    this.residentsByExternalId.set(resident.personExternalId, resident);
  }

  /**
   * Populates `this.assignedStaffByExternalId` with the API response for the staff
   * matching `staffId`. Throws if the API request fails.
   */
  *populateAssignedStaffById(
    staffId: string,
  ): FlowMethod<DataAPI["incarcerationStaffById"], void> {
    const staff = yield this.apiClient.incarcerationStaffById(staffId);
    this.assignedStaffByExternalId.set(staffId, staff);
  }

  /**
   * Populates `this.residentsByExternalId` with the API response for the resident
   * with personExternalId matching `residentExternalId`, and `this.assignedStaffByExternalId`
   * with the API response for the staff matching that resident's `officerId`. Throws if the
   * API request fails.
   */
  *populateResidentAndAssignedStaffById(
    residentExternalId: string,
  ): FlowMethod<DataAPI["residentAndAssignedStaffById"], void> {
    const { resident, staff } =
      yield this.apiClient.residentAndAssignedStaffById(residentExternalId);
    this.residentsByExternalId.set(resident.personExternalId, resident);
    this.assignedStaffByExternalId.set(staff.id, staff);
  }
}
