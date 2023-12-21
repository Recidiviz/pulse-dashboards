/*
 * Recidiviz - a data platform for criminal justice reform
 * Copyright (C) 2023 Recidiviz, Inc.
 *
 * This program is free software: you can redistribute it and/or modify
 * it under the terms of the GNU General Public License as published by
 * the Free Software Foundation, either version 3 of the License, or
 * (at your option) any later version.
 *
 * This program is distributed in the hope that it will be useful,
 * but WITHOUT ANY WARRANTY; without even the implied warranty of
 * MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.  See the
 * GNU General Public License for more details.
 *
 * You should have received a copy of the GNU General Public License
 * along with this program.  If not, see <https://www.gnu.org/licenses/>.
 * =============================================================================
 *
 */

import { TenantConfig } from "../core/models/types";
import * as dashboard from "../RootStore/TenantStore/dashboardTenants";
import {
  getStateOpportunityTypes,
  OpportunityType,
} from "../WorkflowsStore/Opportunity/OpportunityConfigs";

const WORKFLOWS_OPPORTUNITY_TYPES: OpportunityType[] =
  getStateOpportunityTypes("US_OR");

const US_OR_CONFIG: TenantConfig = {
  name: "Oregon",
  stateCode: "OR",
  domain: "doc.oregon.gov",
  availableStateCodes: [dashboard.US_OR],
  enableUserRestrictions: false,
  workflowsSupportedSystems: ["SUPERVISION"],
  opportunityTypes: WORKFLOWS_OPPORTUNITY_TYPES,
  workflowsSystemConfigs: {
    SUPERVISION: {
      searchType: "OFFICER",
      searchField: "officerId",
      searchTitleOverride: "officer",
    },
  },
  navigation: {
    workflows: ["home", "clients", ...WORKFLOWS_OPPORTUNITY_TYPES],
  },
};

export default US_OR_CONFIG;
