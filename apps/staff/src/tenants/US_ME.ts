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
import { PATHWAYS_PAGES, PATHWAYS_SECTIONS } from "../core/views";
import * as pathways from "../RootStore/TenantStore/pathwaysTenants";
import { OpportunityType } from "../WorkflowsStore/Opportunity/OpportunityType/types";
import { getStateOpportunityTypes } from "../WorkflowsStore/Opportunity/OpportunityType/utils";
import { filterByUserDistrict } from "../WorkflowsStore/utils";

const WORKFLOWS_OPPORTUNITY_TYPES: OpportunityType[] =
  getStateOpportunityTypes("US_ME");

const US_ME_CONFIG: TenantConfig = {
  name: "Maine",
  stateCode: "ME",
  domain: "maine.gov",
  pathwaysNameOverride: "Pathways",
  availableStateCodes: [pathways.US_ME],
  enableUserRestrictions: false,
  opportunityTypes: WORKFLOWS_OPPORTUNITY_TYPES,
  workflowsStaffFilterFn: filterByUserDistrict,
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
  navigation: {
    workflows: ["home", "clients", ...WORKFLOWS_OPPORTUNITY_TYPES],
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
      PATHWAYS_SECTIONS.countByOfficer,
      PATHWAYS_SECTIONS.countBySupervisionLevel,
      PATHWAYS_SECTIONS.countByGender,
      PATHWAYS_SECTIONS.countByRace,
    ],
    supervision: [
      PATHWAYS_SECTIONS.countOverTime,
      PATHWAYS_SECTIONS.countByLocation,
      PATHWAYS_SECTIONS.countBySupervisionLevel,
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
    methodology: ["system"],
  },
  tableColumns: enabledTableColumns[pathways.US_ME],
};

export default US_ME_CONFIG;
