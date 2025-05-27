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
import * as dashboards from "../RootStore/TenantStore/dashboardTenants";

const US_PA_CONFIG: TenantConfig<"US_PA"> = {
  name: "Pennsylvania",
  stateCode: "PA",
  domain: "pa.gov",
  availableStateCodes: [dashboards.US_PA],
  workflowsSupportedSystems: ["SUPERVISION"],
  workflowsMethodologyUrl:
    "https://docs.google.com/document/d/e/2PACX-1vSdsgMDOmD7tR_IP8NwqYggO6w9MBsAdB3jZp8ZEfWSseoGw0_6gBuF1hw6AGUskESpnA7htA8uct_y/pub",
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
  enableUserRestrictions: false,
  navigation: {
    insights: [INSIGHTS_PAGES.supervision],
    workflows: ["home", "clients"],
    revocations: [],
  },
  featureVariants: { zeroGrantsFlag: {} },
};

export default US_PA_CONFIG;
