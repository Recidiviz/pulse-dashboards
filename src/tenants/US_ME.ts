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
import { OpportunityType } from "../WorkflowsStore";

const WORKFLOWS_OPPORTUNITY_TYPES: OpportunityType[] = [
  "usMeSCCP",
  "usMeEarlyTermination",
];

const US_ME_CONFIG: TenantConfig = {
  name: "Maine",
  stateCode: "ME",
  availableStateCodes: [pathways.US_ME],
  enableUserRestrictions: false,
  opportunityTypes: WORKFLOWS_OPPORTUNITY_TYPES,
  workflowsSupportedSystems: ["INCARCERATION"],
  workflowsOfficerTitleOverride: "case manager",
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
    "id-methodology": ["system"],
  },
  pagesWithRestrictions: [
    "libertyToPrison",
    "prison",
    "prisonToSupervision",
    "supervisionToPrison",
    "supervisionToLiberty",
    "supervision",
    "workflows",
  ],
  tableColumns: enabledTableColumns[pathways.US_ME],
};

export default US_ME_CONFIG;
