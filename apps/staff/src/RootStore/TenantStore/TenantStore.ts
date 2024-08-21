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

import { makeAutoObservable, when } from "mobx";
import qs from "query-string";

import { StaffFilter } from "../../core/models/types";
import { CombinedUserRecord } from "../../FirestoreStore";
import tenants from "../../tenants";
import { StaffFilterFunction } from "../../WorkflowsStore";
import type RootStore from "..";
import {
  isTenantId,
  LanternMethodology,
  LanternTenants,
  TenantId,
} from "../types";
import UserStore from "../UserStore";
import getDistrictKeyMap, { DistrictKeyMap } from "./districtKeyMappings";
import { LANTERN_TENANTS } from "./lanternTenants";
import methodology from "./methodology";

export const CURRENT_TENANT_IN_SESSION = "adminUserCurrentTenantInSession";
const TENANT_ID_QUERY_PARAM = "tenantId";

/*
 * Returns the current state that should be viewed, in priority of:
 *  1. The tenantId query param, if set (Recidiviz users only)
 *  2. The sessionStorage cache if already set
 *  3. The first available state in alphabetical order.
 */
function getTenantIdFromUser(userStore: UserStore): TenantId | undefined {
  const storageStateCode = sessionStorage.getItem(CURRENT_TENANT_IN_SESSION) as
    | TenantId
    | undefined;

  if (userStore.user) {
    const { availableStateCodes, userHasAccess, isRecidivizUser } = userStore;

    if (isRecidivizUser) {
      const queryTenantId = getTenantIdFromQuery();
      if (queryTenantId) {
        return queryTenantId;
      }
    }

    if (storageStateCode && userHasAccess(storageStateCode)) {
      return storageStateCode;
    }
    return availableStateCodes[0] as TenantId;
  }

  return storageStateCode;
}

function getTenantIdFromQuery(): TenantId | undefined {
  const query = qs.parse(window.location.search);
  const queryTenantId = query[TENANT_ID_QUERY_PARAM] as string;

  if (isTenantId(queryTenantId)) {
    return queryTenantId;
  }
}

const defaultStaffFilterFunction: StaffFilterFunction = (
  user: CombinedUserRecord,
) => {
  return user.updates?.overrideDistrictIds
    ? ({
        filterField: "district",
        filterValues: user.updates.overrideDistrictIds,
      } as StaffFilter)
    : undefined;
};

export default class TenantStore {
  rootStore;

  currentTenantId?: TenantId;

  constructor({ rootStore }: { rootStore: typeof RootStore }) {
    makeAutoObservable(this);

    this.rootStore = rootStore;

    when(
      () => !this.rootStore.userStore.userIsLoading,
      () =>
        this.setCurrentTenantId(getTenantIdFromUser(this.rootStore.userStore)),
    );
  }

  /**
   * Saves the tenant ID in the query, if it isn't already (Recidiviz users only)
   * Gets called every navigation change by {@link ProtectedLayout}
   */
  saveTenantIdToQuery() {
    when(
      () => this.rootStore.userStore.isAuthorized,
      () => {
        if (!this.rootStore.userStore.isRecidivizUser) {
          return;
        }

        const tenantId = getTenantIdFromUser(this.rootStore.userStore);
        const queryTenenant = getTenantIdFromQuery();

        // Since the tenant ID query get/set system is outside the rest of the routing,
        // we directly manipulate the page's query string
        if (tenantId && queryTenenant !== tenantId) {
          const url = new URL(location.href);
          url.searchParams.set(TENANT_ID_QUERY_PARAM, tenantId);
          window.history.replaceState(null, "", url.toString());
        }
      },
    );
  }

  setCurrentTenantId(tenantId: TenantId | undefined): void {
    this.currentTenantId = tenantId;
    if (tenantId) {
      sessionStorage.setItem(CURRENT_TENANT_IN_SESSION, tenantId);
      this.saveTenantIdToQuery();
    }
  }

  get isLanternTenant(): boolean {
    if (!this.currentTenantId) return false;
    const tenantId = this.currentTenantId as LanternTenants;
    return LANTERN_TENANTS.includes(tenantId);
  }

  get tenantMappings(): DistrictKeyMap {
    if (!this.currentTenantId) return {};
    return getDistrictKeyMap(this.currentTenantId);
  }

  get methodology(): LanternMethodology {
    if (!this.currentTenantId) return {};
    const tenantId = this.currentTenantId as LanternTenants;
    return methodology[tenantId];
  }

  get stateName(): string {
    if (!this.currentTenantId) return "";
    return tenants[this.currentTenantId].name;
  }

  get stateCode(): string {
    if (!this.currentTenantId) return "";
    return tenants[this.currentTenantId].stateCode;
  }

  get domain(): string | undefined {
    if (!this.currentTenantId) return "";
    return tenants[this.currentTenantId].domain;
  }

  get enableUserRestrictions(): boolean {
    if (!this.currentTenantId) return false;
    return (
      tenants[this.currentTenantId].enableUserRestrictions &&
      Array.isArray(this.rootStore.userStore.allowedSupervisionLocationIds) &&
      this.rootStore.userStore.allowedSupervisionLocationIds.length > 0
    );
  }

  get pathwaysName(): string {
    if (!this.currentTenantId) return "";
    return (
      tenants[this.currentTenantId].pathwaysNameOverride ??
      "System-Level Trends"
    );
  }

  get insightsLaunchedDistricts(): string[] | undefined {
    if (!this.currentTenantId) return;
    return tenants[this.currentTenantId].insightsLaunchedDistricts;
  }

  get insightsLanternState(): boolean {
    if (!this.currentTenantId) return false;
    return tenants[this.currentTenantId].insightsLanternState ?? false;
  }

  get insightsLegacyUI(): boolean {
    if (!this.currentTenantId) return false;
    return !!tenants[this.currentTenantId].insightsLegacyUI;
  }

  /**
   * Returns the function used to filter which staff members a user can search for. If the tenant
   * config does not specify one, returns a function which allows all staff to search for anyone
   * unless they have override districts set, in which case they can only search within the
   * override districts.
   */
  get workflowsStaffFilterFn(): StaffFilterFunction {
    if (!this.currentTenantId) return defaultStaffFilterFunction;

    return (
      tenants[this.currentTenantId]?.workflowsStaffFilterFn ??
      defaultStaffFilterFunction
    );
  }

  get releaseDateCopy(): string {
    if (!this.currentTenantId) return "";
    return tenants[this.currentTenantId].releaseDateCopyOverride ?? "Release";
  }
}
