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

import { TenantConfig } from "../core/models/types";
import * as dashboard from "../RootStore/TenantStore/dashboardTenants";

const US_AZ_CONFIG: TenantConfig<"US_AZ"> = {
  name: "Arizona",
  stateCode: "AZ",
  domain: "corrections.az.gov",
  availableStateCodes: [dashboard.US_AZ],
  enableUserRestrictions: false,
  workflowsSupportedSystems: ["SUPERVISION", "INCARCERATION"],
  workflowsSystemConfigs: {
    INCARCERATION: {
      search: [
        {
          searchType: "INCARCERATION_OFFICER",
          searchField: ["officerId"],
          searchTitle: "COIII",
          searchTitleIgnoreCase: true,
        },
        {
          searchType: "LOCATION",
          searchField: ["facilityId"],
          searchTitle: "facility",
          locationIdType: "facilityId",
          restrictedToFeatureVariant: "usAzFacilitySearch",
        },
      ],
    },
    SUPERVISION: {
      search: [
        {
          searchType: "OFFICER",
          searchField: ["officerId"],
          searchTitle: "CRO",
          searchTitleIgnoreCase: true,
        },
      ],
    },
  },
  navigation: {
    workflows: ["home", "residents"],
  },
  incarcerationStaffTitleOverride: "COIII",
  releaseDateCopyOverride: "SED",
};

export default US_AZ_CONFIG;
