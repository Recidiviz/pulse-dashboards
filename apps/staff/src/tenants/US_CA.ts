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
import { INSIGHTS_PAGES } from "../core/views";
import * as dashboard from "../RootStore/TenantStore/dashboardTenants";
import { usCaFilterByRoleSubtype } from "../WorkflowsStore/utils";

const US_CA_CONFIG: TenantConfig<"US_CA"> = {
  name: "California",
  stateCode: "CA",
  domain: "cdcr.ca.gov",
  DOCName: "CDCR",
  internalSystemName: "OMS",
  availableStateCodes: [dashboard.US_CA],
  enableUserRestrictions: false,
  workflowsSupportedSystems: ["SUPERVISION"],
  workflowsMethodologyUrl:
    "https://drive.google.com/file/d/1qIXF7G6CY_pVbNTNTyHvYJF1lAIgiy1n/view?usp=sharing",
  workflowsStaffFilterFn: usCaFilterByRoleSubtype,
  workflowsSystemConfigs: {
    SUPERVISION: {
      search: [
        {
          searchType: "OFFICER",
          searchField: ["officerId"],
          searchTitle: "agent",
        },
      ],
    },
  },
  navigation: {
    // The order of pages here determines where the user will land first when navigating from `/`
    insights: [INSIGHTS_PAGES.supervision],
    workflows: ["home", "milestones", "clients"],
  },
  insightsUnitState: true,
  featureVariants: {
    outcomesModule: {},
  },
};

export default US_CA_CONFIG;
