// Recidiviz - a data platform for criminal justice reform
// Copyright (C) 2025 Recidiviz, Inc.
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

import { TenantConfig } from "../core/models/types";
import { US_NC } from "../RootStore/TenantStore/dashboardTenants";

const US_NC_CONFIG: TenantConfig<"US_NC"> = {
  name: "North Carolina",
  stateCode: "NC",
  domain: "dac.nc.gov",
  DOCName: "NCDAC",
  enableUserRestrictions: false,
  availableStateCodes: [US_NC],
  workflowsSupportedSystems: ["SUPERVISION", "INCARCERATION"],
  workflowsSystemConfigs: {
    SUPERVISION: {
      search: [
        {
          searchType: "OFFICER",
          searchField: ["officerId"],
          searchTitle: "officer",
        },
      ],
    },
    INCARCERATION: {
      search: [
        {
          searchType: "FACILITY",
          searchField: ["facilityId"],
          searchTitle: "facility",
        },
      ],
    },
  },
  navigation: {
    workflows: ["home", "clients", "rna"],
  },
};

export default US_NC_CONFIG;
