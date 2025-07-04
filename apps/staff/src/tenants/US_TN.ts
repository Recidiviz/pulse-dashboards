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
import enabledTableColumns from "../core/utils/enabledTableColumns";
import {
  DASHBOARD_VIEWS,
  INSIGHTS_PAGES,
  PATHWAYS_PAGES,
  PATHWAYS_SECTIONS,
} from "../core/views";
import * as pathways from "../RootStore/TenantStore/pathwaysTenants";
import { filterByUserDistrict } from "../WorkflowsStore/utils";

const US_TN_CONFIG: TenantConfig<"US_TN"> = {
  name: "Tennessee",
  stateCode: "TN",
  domain: "tn.gov",
  pathwaysNameOverride: "Pathways",
  supervisionEndCopyOverride: "Expiration",
  availableStateCodes: [pathways.US_TN],
  enableUserRestrictions: false,
  workflowsStaffFilterFn: filterByUserDistrict,
  workflowsSupportedSystems: ["SUPERVISION", "INCARCERATION"],
  workflowsMethodologyUrl:
    "https://drive.google.com/file/d/1fkqncNb_GNYBvRfOgij4QHw4HEdkkHHz/view?usp=sharing",
  workflowsSystemConfigs: {
    INCARCERATION: {
      search: [
        {
          searchType: "LOCATION",
          searchField: ["facilityUnitId"],
          searchTitle: "unit",
        },
      ],
    },
    SUPERVISION: {
      search: [
        {
          searchType: "OFFICER",
          searchField: ["officerId"],
          searchTitle: "supervision officer",
        },
      ],
    },
  },
  insightsLanternState: true,
  navigation: {
    insights: [INSIGHTS_PAGES.supervision],
    workflows: ["home", "clients", "residents"],
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
    prison: [PATHWAYS_SECTIONS.countOverTime, PATHWAYS_SECTIONS.countByRace],
    supervision: [
      PATHWAYS_SECTIONS.countOverTime,
      PATHWAYS_SECTIONS.countByLocation,
      PATHWAYS_SECTIONS.countBySupervisionLevel,
      PATHWAYS_SECTIONS.countByRace,
    ],
    prisonToSupervision: [
      PATHWAYS_SECTIONS.countOverTime,
      PATHWAYS_SECTIONS.countByAgeGroup,
      PATHWAYS_SECTIONS.countByRace,
    ],
    supervisionToPrison: [
      PATHWAYS_SECTIONS.countOverTime,
      PATHWAYS_SECTIONS.countByLocation,
      PATHWAYS_SECTIONS.countByGender,
      PATHWAYS_SECTIONS.countByRace,
    ],
    supervisionToLiberty: [
      PATHWAYS_SECTIONS.countOverTime,
      PATHWAYS_SECTIONS.countByLocation,
      PATHWAYS_SECTIONS.countByGender,
      PATHWAYS_SECTIONS.countByAgeGroup,
      PATHWAYS_SECTIONS.countByRace,
    ],
    methodology: [DASHBOARD_VIEWS.system],
  },
  tableColumns: enabledTableColumns[pathways.US_TN],
  featureVariants: {
    outcomesModule: {},
  },
};

export default US_TN_CONFIG;
