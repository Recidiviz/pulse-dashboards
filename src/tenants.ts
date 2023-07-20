// Recidiviz - a data platform for criminal justice reform
// Copyright (C) 2022 Recidiviz, Inc.
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
  US_CA,
} from "./RootStore/TenantStore/dashboardTenants";
import * as lantern from "./RootStore/TenantStore/lanternTenants";
import { LANTERN_TENANTS } from "./RootStore/TenantStore/lanternTenants";
import * as pathways from "./RootStore/TenantStore/pathwaysTenants";
import { TenantId } from "./RootStore/types";
import US_CA_CONFIG from "./tenants/US_CA";
import US_CO_CONFIG from "./tenants/US_CO";
import US_ID_CONFIG from "./tenants/US_ID";
import US_ME_CONFIG from "./tenants/US_ME";
import US_MI_CONFIG from "./tenants/US_MI";
import US_MO_CONFIG from "./tenants/US_MO";
import US_NC_CONFIG from "./tenants/US_NC";
import US_ND_CONFIG from "./tenants/US_ND";
import US_PA_CONFIG from "./tenants/US_PA";
import US_TN_CONFIG from "./tenants/US_TN";

export const RECIDIVIZ_TENANT = "RECIDIVIZ";
// TODO(#3622): [Dashboard][Auth] Remove lantern state code from frontend
export const LANTERN = "LANTERN";
export const CSG = "CSG";

type Tenants = {
  [key in TenantId]: TenantConfig;
};

const ALL_TENANTS = uniq([...DASHBOARD_TENANTS, ...LANTERN_TENANTS]);

const TENANTS: Tenants = {
  [US_CA]: US_CA_CONFIG,
  [pathways.US_CO]: US_CO_CONFIG,
  [pathways.US_ID]: US_ID_CONFIG,
  [pathways.US_ME]: US_ME_CONFIG,
  [pathways.US_MI]: US_MI_CONFIG,
  [lantern.US_MO]: US_MO_CONFIG,
  [pathways.US_NC]: US_NC_CONFIG,
  [pathways.US_ND]: US_ND_CONFIG,
  [lantern.US_PA]: US_PA_CONFIG,
  [pathways.US_TN]: US_TN_CONFIG,
  RECIDIVIZ: {
    name: "Recidiviz",
    domain: "recidiviz.org",
    stateCode: "Recidiviz",
    workflowsSupportedSystems: ["INCARCERATION", "SUPERVISION"],
    workflowsSystemConfigs: {
      INCARCERATION: {
        searchType: "OFFICER",
        searchField: "officerId",
        searchTitleOverride: "case manager",
      },
      SUPERVISION: {
        searchType: "OFFICER",
        searchField: "officerId",
        searchTitleOverride: "officer",
      },
    },
    availableStateCodes: ALL_TENANTS,
    enableUserRestrictions: true,
  },
  // TODO(#3622): [Dashboard][Auth] Remove lantern state code from frontend
  LANTERN: {
    name: "Lantern",
    stateCode: "Lantern",
    availableStateCodes: [
      ...lantern.LANTERN_TENANTS,
      pathways.US_MI,
      pathways.US_TN,
    ],
    enableUserRestrictions: false,
  },
  CSG: {
    name: "CSG",
    stateCode: "CSG",
    availableStateCodes: [
      ...lantern.LANTERN_TENANTS,
      pathways.US_MI,
      pathways.US_TN,
    ],
    enableUserRestrictions: false,
  },
};

export default TENANTS;
