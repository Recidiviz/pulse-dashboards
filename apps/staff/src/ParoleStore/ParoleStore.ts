// Recidiviz - a data platform for criminal justice reform
// Copyright (C) 2026 Recidiviz, Inc.
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

import { isDemoMode, isOfflineMode } from "~client-env-utils";

import { ParoleConfig } from "../core/models/types";
import { RootStore } from "../RootStore";
import { ParoleAPI } from "./api/interface";
import { isSupportedTenantId, ParoleAPIClient } from "./api/ParoleAPIClient";
import { ParoleOfflineAPIClient } from "./api/ParoleOfflineAPIClient";

/* TODO(OBT-41775): Point the remaining fields/methods at a real
 * ParoleAPIClient once a full Parole backend exists. See
 * ParoleAPIClient.SUPPORTED_TENANT_IDS for what's real today (currently
 * US_ID and US_CO, partially).
 */
export class ParoleStore {
  constructor(public rootStore: RootStore) {
    makeAutoObservable(this);
  }

  get apiClient(): ParoleAPI {
    const { currentTenantId } = this.rootStore.tenantStore;
    const hasRealData =
      isSupportedTenantId(currentTenantId) && !isOfflineMode() && !isDemoMode();
    return hasRealData
      ? new ParoleAPIClient(this)
      : new ParoleOfflineAPIClient(this);
  }

  get config(): ParoleConfig {
    const { currentTenantId, currentTenantConfig } = this.rootStore.tenantStore;
    if (!currentTenantConfig) {
      throw new Error(
        "ParoleStore.config accessed with no current tenant configured",
      );
    }
    if (!currentTenantConfig.paroleConfig) {
      throw new Error(
        `Tenant [${currentTenantId}] has no paroleConfig set. Add one in ` +
          `tenants/<STATE>.ts to enable the Parole board for this tenant.`,
      );
    }
    return currentTenantConfig.paroleConfig;
  }
}
