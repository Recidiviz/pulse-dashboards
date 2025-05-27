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
import { METRIC_TYPE_LABELS, METRIC_TYPES } from "../core/PageVitals/types";
import enabledTableColumns from "../core/utils/enabledTableColumns";
import {
  INSIGHTS_PAGES,
  PATHWAYS_PAGES,
  PATHWAYS_SECTIONS,
} from "../core/views";
import * as pathways from "../RootStore/TenantStore/pathwaysTenants";
import UsNdContactTask from "../WorkflowsStore/Task/UsNdContactTask";
import UsNdRiskAssessmentTask from "../WorkflowsStore/Task/UsNdRiskAssessmentTask";

const US_ND_CONFIG: TenantConfig<"US_ND"> = {
  name: "North Dakota",
  stateCode: "ND",
  domain: "nd.gov",
  availableStateCodes: [pathways.US_ND],
  enableUserRestrictions: false,
  workflowsSupportedSystems: ["SUPERVISION", "INCARCERATION"],
  workflowsMethodologyUrl:
    "https://drive.google.com/file/d/1eHbSEOjjT9FvxffSbXOYEfOYPJheeu6t/view",
  workflowsTasksConfig: {
    collection: "usNdSupervisionTasks",
    methodologyUrl:
      "https://docs.google.com/document/d/1BmzbVFUQhbWOs9IOwR-gykUHNtZin5iUyzPdn8zRdx4/edit",
    tasks: {
      assessment: {
        constructor: UsNdRiskAssessmentTask,
      },
      contact: {
        constructor: UsNdContactTask,
      },
    },
  },
  workflowsSystemConfigs: {
    INCARCERATION: {
      search: [
        {
          searchType: "INCARCERATION_OFFICER",
          searchField: ["officerId"],
          searchTitle: "case manager",
        },
      ],
    },
    SUPERVISION: {
      search: [
        {
          searchType: "OFFICER",
          searchField: ["officerId"],
          searchTitle: "officer",
        },
      ],
    },
  },
  releaseDateCopyOverride: "Good Time Release Date",
  navigation: {
    insights: [INSIGHTS_PAGES.supervision],
    workflows: ["home", "clients", "residents"],
    operations: [],
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
      // PATHWAYS_SECTIONS.countBySupervisionLevel,
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
    psi: [],
    methodology: ["system", "operations"],
  },
  tableColumns: enabledTableColumns[pathways.US_ND],
  vitalsMetrics: [
    {
      name: METRIC_TYPE_LABELS.OVERALL,
      id: METRIC_TYPES.OVERALL,
      description: "Average timeliness across all metrics",
      accessor: "overall",
    },
    {
      name: METRIC_TYPE_LABELS.DISCHARGE,
      id: METRIC_TYPES.DISCHARGE,
      description: `of clients were discharged at their earliest projected regular
        supervision discharge date`,
      accessor: "timelyDischarge",
    },
    {
      name: METRIC_TYPE_LABELS.CONTACT,
      id: METRIC_TYPES.CONTACT,
      description: `of clients received initial contact within 30 days of
        starting supervision and a F2F contact every subsequent 3 months,
        2 months, or 1 month for minimum, medium, and maximum supervision
        levels respectively`,
      accessor: "timelyContact",
    },
    {
      name: METRIC_TYPE_LABELS.RISK_ASSESSMENT,
      id: METRIC_TYPES.RISK_ASSESSMENT,
      description: `of clients have had an initial assessment within 30 days and 
        reassessment within 212 days`,
      accessor: "timelyRiskAssessment",
    },
  ],
};

export default US_ND_CONFIG;
