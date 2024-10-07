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

const US_CA_CONFIG: TenantConfig = {
  name: "California",
  stateCode: "CA",
  domain: "cdcr.ca.gov",
  DOCName: "CDCR",
  internalSystemName: "OMS",
  workflowsHomepage: "milestones",
  availableStateCodes: [dashboard.US_CA],
  enableUserRestrictions: false,
  workflowsSupportedSystems: ["SUPERVISION"],
  workflowsStaffFilterFn: usCaFilterByRoleSubtype,
  workflowsSystemConfigs: {
    SUPERVISION: {
      searchType: "OFFICER",
      searchField: "officerId",
      searchTitleOverride: "agent",
    },
  },
  navigation: {
    workflows: ["milestones", "clients"],
    insights: [INSIGHTS_PAGES.supervision],
  },
  milestoneTypes: [
    "HOUSING_TYPE_IS_NOT_TRANSIENT",
    "SUSTAINABLE_HOUSING_6_MONTHS",
    "SUSTAINABLE_HOUSING_12_MONTHS",
    "NO_VIOLATION_WITHIN_6_MONTHS",
    "NO_VIOLATION_WITHIN_12_MONTHS",
    "GAINED_EMPLOYMENT",
    "EMPLOYED_6_MONTHS",
    "EMPLOYED_12_MONTHS",
    "PARTICIPATED_IN_PROGRAMMING_FOR_6_TO_8_MONTHS",
    "PARTICIPATED_IN_PROGRAMMING_FOR_12_TO_14_MONTHS",
  ],
  insightsLegacyUI: true,
  insightsUnitState: true,
};

export default US_CA_CONFIG;
