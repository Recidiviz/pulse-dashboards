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

import { uniq } from "lodash";

import { TenantConfig } from "./core/models/types";
import {
  DASHBOARD_TENANTS,
  US_AR,
  US_AZ,
  US_CA,
  US_IA,
  US_ME,
  US_MI,
  US_NE,
  US_OR,
  US_TX,
} from "./RootStore/TenantStore/dashboardTenants";
import * as lantern from "./RootStore/TenantStore/lanternTenants";
import { LANTERN_TENANTS } from "./RootStore/TenantStore/lanternTenants";
import * as pathways from "./RootStore/TenantStore/pathwaysTenants";
import { TenantConfigId } from "./RootStore/types";
import { CSG_CONFIG } from "./tenants/CSG";
import US_AR_CONFIG from "./tenants/US_AR";
import US_AZ_CONFIG from "./tenants/US_AZ";
import US_CA_CONFIG from "./tenants/US_CA";
import US_IA_CONFIG from "./tenants/US_IA";
import US_ID_CONFIG from "./tenants/US_ID";
import US_ME_CONFIG from "./tenants/US_ME";
import US_MI_CONFIG from "./tenants/US_MI";
import US_MO_CONFIG from "./tenants/US_MO";
import US_ND_CONFIG from "./tenants/US_ND";
import US_NE_CONFIG from "./tenants/US_NE";
import US_OR_CONFIG from "./tenants/US_OR";
import US_PA_CONFIG from "./tenants/US_PA";
import US_TN_CONFIG from "./tenants/US_TN";
import US_TX_CONFIG from "./tenants/US_TX";

export const RECIDIVIZ_TENANT = "RECIDIVIZ";
export const CSG = "CSG";

export type TenantConfigs = {
  [K in TenantConfigId]: TenantConfig<K>;
};

// Add any new tenant IDs to the list in `fetchOfflineUser.js` to enable in offline mode.
const ALL_TENANTS = uniq([...DASHBOARD_TENANTS, ...LANTERN_TENANTS]);

export const TENANT_CONFIGS: TenantConfigs = {
  [US_AZ]: US_AZ_CONFIG,
  [US_AR]: US_AR_CONFIG,
  [US_CA]: US_CA_CONFIG,
  [US_IA]: US_IA_CONFIG,
  [pathways.US_ID]: US_ID_CONFIG,
  [US_ME]: US_ME_CONFIG,
  [US_MI]: US_MI_CONFIG,
  [lantern.US_MO]: US_MO_CONFIG,
  [US_NE]: US_NE_CONFIG,
  [pathways.US_ND]: US_ND_CONFIG,
  [US_OR]: US_OR_CONFIG,
  [lantern.US_PA]: US_PA_CONFIG,
  [pathways.US_TN]: US_TN_CONFIG,
  [US_TX]: US_TX_CONFIG,
  RECIDIVIZ: {
    name: "Recidiviz",
    domain: "recidiviz.org",
    stateCode: "Recidiviz",
    workflowsSupportedSystems: ["INCARCERATION", "SUPERVISION"],
    workflowsSystemConfigs: {
      INCARCERATION: {
        search: [
          {
            searchType: "OFFICER",
            searchField: ["officerId"],
          },
        ],
        searchTitleOverride: "case manager",
      },
      SUPERVISION: {
        search: [
          {
            searchType: "OFFICER",
            searchField: ["officerId"],
          },
        ],
        searchTitleOverride: "officer",
      },
    },
    availableStateCodes: ALL_TENANTS,
    enableUserRestrictions: true,
  },
  CSG: CSG_CONFIG,
};
