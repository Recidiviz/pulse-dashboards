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

import { StaffFilter, WorkflowsTasksConfig } from "../../core/models/types";
import { SupervisionTaskCategory } from "../../core/WorkflowsTasks/fixtures";
import { CombinedUserRecord } from "../../FirestoreStore";
import { TenantConfigs } from "../../tenants";
import { StaffFilterFunction } from "../../WorkflowsStore";
import { RootStore } from "../index";
import {
  FeatureVariantRecord,
  isTenantId,
  LanternMethodology,
  LanternTenants,
  TenantId,
} from "../types";
import UserStore from "../UserStore";
import getDistrictKeyMap, { DistrictKeyMap } from "./districtKeyMappings";
import { LANTERN_TENANTS } from "./lanternTenants";
import methodology from "./methodology";

type TenantConfigLabelType =
  | "supervisionEndDateCopy"
  | "incarcerationStaffTitle"
  | "releaseDateCopy";

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
  tenantConfigs: TenantConfigs;

  constructor({
    rootStore,
    tenantConfigs,
  }: {
    rootStore: RootStore;
    tenantConfigs: TenantConfigs;
  }) {
    makeAutoObservable(this);

    this.rootStore = rootStore;
    this.tenantConfigs = tenantConfigs;

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
    return this.tenantConfigs[this.currentTenantId].name;
  }

  get stateCode(): string {
    if (!this.currentTenantId) return "";
    return this.tenantConfigs[this.currentTenantId].stateCode;
  }

  get domain(): string | undefined {
    if (!this.currentTenantId) return "";
    return this.tenantConfigs[this.currentTenantId].domain;
  }

  get enableUserRestrictions(): boolean {
    if (!this.currentTenantId) return false;
    return (
      this.tenantConfigs[this.currentTenantId].enableUserRestrictions &&
      Array.isArray(this.rootStore.userStore.allowedSupervisionLocationIds) &&
      this.rootStore.userStore.allowedSupervisionLocationIds.length > 0
    );
  }

  get pathwaysName(): string {
    if (!this.currentTenantId) return "";
    return (
      this.tenantConfigs[this.currentTenantId].pathwaysNameOverride ??
      "System-Level Trends"
    );
  }

  get insightsLaunchedDistricts(): string[] | undefined {
    if (!this.currentTenantId) return;
    return this.tenantConfigs[this.currentTenantId].insightsLaunchedDistricts;
  }

  get insightsLanternState(): boolean {
    if (!this.currentTenantId) return false;
    return (
      this.tenantConfigs[this.currentTenantId].insightsLanternState ?? false
    );
  }

  get taskCategories(): SupervisionTaskCategory[] {
    const { tasksConfiguration } = this;
    // Object.keys just makes the type string[] even if they keys are restricted
    // @ts-expect-error
    return Object.keys(tasksConfiguration?.tasks ?? {});
  }

  get tasksConfiguration(): WorkflowsTasksConfig | undefined {
    if (!this.currentTenantId) return;

    return this.tenantConfigs[this.currentTenantId].workflowsTasksConfig;
  }

  /**
   * Returns the boolean from the tenant config which specifies whether to display the supervisor's
   * supervisionUnit rather than the supervisionDistrict on the Supervisor Page (and Staff page in legacy layout)
   */
  get insightsUnitState(): boolean {
    if (!this.currentTenantId) return false;
    return !!this.tenantConfigs[this.currentTenantId].insightsUnitState;
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
      this.tenantConfigs[this.currentTenantId]?.workflowsStaffFilterFn ??
      defaultStaffFilterFunction
    );
  }

  get supervisionDisplayIdCopy(): string | undefined {
    const config = this.currentTenantId
      ? this.tenantConfigs[this.currentTenantId]
      : undefined;
    return config?.supervisionDisplayIdCopy;
  }

  get facilitiesDisplayIdCopy(): string | undefined {
    const config = this.currentTenantId
      ? this.tenantConfigs[this.currentTenantId]
      : undefined;
    return config?.facilitiesDisplayIdCopy;
  }

  // Copy used for the Workflows tool, with reasonable defaults
  get labels(): Record<TenantConfigLabelType, string> {
    const config = this.currentTenantId
      ? this.tenantConfigs[this.currentTenantId]
      : undefined;
    return {
      releaseDateCopy: config?.releaseDateCopyOverride ?? "Release",
      supervisionEndDateCopy: config?.supervisionEndCopyOverride ?? "End",
      incarcerationStaffTitle:
        config?.incarcerationStaffTitleOverride ?? "Case Manager",
    };
  }

  get tenantFeatureVariants(): FeatureVariantRecord {
    if (!this.currentTenantId) return {};
    return this.tenantConfigs[this.currentTenantId].featureVariants ?? {};
  }

  get workflowsMethodologyUrl(): string | undefined {
    if (!this.currentTenantId) return;
    return this.tenantConfigs[this.currentTenantId].workflowsMethodologyUrl;
  }

  get currentTenantConfig() {
    if (!this.currentTenantId) return;
    return this.tenantConfigs[this.currentTenantId];
  }
}
