// Recidiviz - a data platform for criminal justice reform
// Copyright (C) 2023 Recidiviz, Inc.
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

import { makeAutoObservable } from "mobx";

import { isOfflineMode } from "~client-env-utils";

import { RootStore } from "../RootStore";
import { PSIAPIClient } from "./api/PSIAPIClient";
import { PSIOfflineAPIClient } from "./api/PSIOfflineAPIClient";
import { PSICaseStore } from "./stores/PSICaseStore";
import { PSIStaffStore } from "./stores/PSIStaffStore";

export class PSIStore {
  psiStaffStore?: PSIStaffStore;

  psiCaseStore?: PSICaseStore;

  apiClient: PSIAPIClient | PSIOfflineAPIClient;

  constructor(public rootStore: RootStore) {
    makeAutoObservable(this);
    this.apiClient = isOfflineMode()
      ? new PSIOfflineAPIClient(this)
      : new PSIAPIClient(this);
    this.psiStaffStore = new PSIStaffStore(this);
    this.psiCaseStore = new PSICaseStore(this);
  }

  get staffPseudoId(): string | undefined {
    return this.rootStore.userStore.userPseudoId;
  }
}
