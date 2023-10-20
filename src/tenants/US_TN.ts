/*
 * Recidiviz - a data platform for criminal justice reform
 * Copyright (C) 2022 Recidiviz, Inc.
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
import enabledTableColumns from "../core/utils/enabledTableColumns";
import {
  DASHBOARD_VIEWS,
  IMPACT_PAGES,
  IMPACT_SECTIONS,
  OUTLIERS_PAGES,
  PATHWAYS_PAGES,
  PATHWAYS_SECTIONS,
} from "../core/views";
import * as pathways from "../RootStore/TenantStore/pathwaysTenants";
import {
  getStateOpportunityTypes,
  OpportunityType,
} from "../WorkflowsStore/Opportunity/OpportunityConfigs";
import { filterByUserDistrict } from "../WorkflowsStore/utils";

const WORKFLOWS_OPPORTUNITY_TYPES: OpportunityType[] =
  getStateOpportunityTypes("US_TN");

const US_TN_CONFIG: TenantConfig = {
  name: "Tennessee",
  stateCode: "TN",
  domain: "tn.gov",
  pathwaysNameOverride: "Pathways",
  availableStateCodes: [pathways.US_TN],
  enableUserRestrictions: false,
  workflowsStaffFilterFn: filterByUserDistrict,
  opportunityTypes: WORKFLOWS_OPPORTUNITY_TYPES,
  workflowsSupportedSystems: ["SUPERVISION", "INCARCERATION"],
  workflowsSystemConfigs: {
    INCARCERATION: {
      searchType: "LOCATION",
      searchField: "facilityUnitId",
      searchTitleOverride: "unit",
    },
  },
  navigation: {
    workflows: ["home", ...WORKFLOWS_OPPORTUNITY_TYPES, "clients"],
    system: [
      PATHWAYS_PAGES.libertyToPrison,
      PATHWAYS_PAGES.prison,
      PATHWAYS_PAGES.prisonToSupervision,
      PATHWAYS_PAGES.supervision,
      PATHWAYS_PAGES.supervisionToPrison,
      PATHWAYS_PAGES.supervisionToLiberty,
    ],
    libertyToPrison: [
      PATHWAYS_SECTIONS.countOverTime,
      PATHWAYS_SECTIONS.countByLocation,
      PATHWAYS_SECTIONS.countByPriorLengthOfIncarceration,
      PATHWAYS_SECTIONS.countByGender,
      PATHWAYS_SECTIONS.countByAgeGroup,
      PATHWAYS_SECTIONS.countByRace,
    ],
    prison: [
      PATHWAYS_SECTIONS.countOverTime,
      PATHWAYS_SECTIONS.countByLocation,
      PATHWAYS_SECTIONS.countByRace,
      PATHWAYS_SECTIONS.personLevelDetail,
    ],
    supervision: [
      PATHWAYS_SECTIONS.countOverTime,
      PATHWAYS_SECTIONS.countByLocation,
      PATHWAYS_SECTIONS.countBySupervisionLevel,
      PATHWAYS_SECTIONS.countByRace,
    ],
    prisonToSupervision: [
      PATHWAYS_SECTIONS.countOverTime,
      PATHWAYS_SECTIONS.countByLocation,
      PATHWAYS_SECTIONS.countByAgeGroup,
      PATHWAYS_SECTIONS.countByRace,
      PATHWAYS_SECTIONS.personLevelDetail,
    ],
    supervisionToPrison: [
      PATHWAYS_SECTIONS.countOverTime,
      PATHWAYS_SECTIONS.countByLengthOfStay,
      PATHWAYS_SECTIONS.countByLocation,
      PATHWAYS_SECTIONS.countByGender,
      PATHWAYS_SECTIONS.countByRace,
    ],
    supervisionToLiberty: [
      PATHWAYS_SECTIONS.countOverTime,
      PATHWAYS_SECTIONS.countByLengthOfStay,
      PATHWAYS_SECTIONS.countByLocation,
      PATHWAYS_SECTIONS.countByGender,
      PATHWAYS_SECTIONS.countByAgeGroup,
      PATHWAYS_SECTIONS.countByRace,
    ],
    "id-methodology": [DASHBOARD_VIEWS.system],
    impact: [IMPACT_PAGES.compliantReportingWorkflows],
    compliantReportingWorkflows: [
      IMPACT_SECTIONS.avgPopulationCompliantReporting,
      IMPACT_SECTIONS.avgDailyPopulation,
    ],
    insights: [OUTLIERS_PAGES.supervision],
  },
  pagesWithRestrictions: [
    "libertyToPrison",
    "prison",
    "prisonToSupervision",
    "supervision",
    "supervisionToPrison",
    "supervisionToLiberty",
    "insights",
  ],
  tableColumns: enabledTableColumns[pathways.US_TN],
};

export default US_TN_CONFIG;
