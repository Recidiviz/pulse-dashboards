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
import { METRIC_TYPE_LABELS, METRIC_TYPES } from "../core/PageVitals/types";
import enabledTableColumns from "../core/utils/enabledTableColumns";
import { PATHWAYS_PAGES, PATHWAYS_SECTIONS } from "../core/views";
import * as pathways from "../RootStore/TenantStore/pathwaysTenants";
import {
  getStateOpportunityTypes,
  OpportunityType,
} from "../WorkflowsStore/Opportunity/OpportunityConfigs";
import UsIdContactTask from "../WorkflowsStore/Task/UsIdContactTask";
import UsIdHomeVisitTask from "../WorkflowsStore/Task/UsIdHomeVisitTask";
import UsIdRiskAssessmentTask from "../WorkflowsStore/Task/UsIdRiskAssessmentTask";
import { filterByUserDistrict } from "../WorkflowsStore/utils";

const WORKFLOWS_OPPORTUNITY_TYPES: OpportunityType[] =
  getStateOpportunityTypes("US_ID");

const US_ID_CONFIG: TenantConfig = {
  name: "Idaho",
  stateCode: "ID",
  domain: "idoc.idaho.gov",
  availableStateCodes: [pathways.US_ID],
  enableUserRestrictions: false,
  workflowsStaffFilterFn: filterByUserDistrict,
  opportunityTypes: WORKFLOWS_OPPORTUNITY_TYPES,
  workflowsTasksConfig: {
    homeVisit: {
      enabled: true,
      snoozeForOptionsInDays: [7, 30, 90],
    },
    contact: {
      enabled: true,
      snoozeForOptionsInDays: [7, 30, 90],
    },
    assessment: {
      enabled: true,
      snoozeForOptionsInDays: [7, 30, 90],
    },
  },
  tasks: {
    homeVisit: UsIdHomeVisitTask,
    contact: UsIdContactTask,
    assessment: UsIdRiskAssessmentTask,
  },
  workflowsSupportedSystems: ["SUPERVISION", "INCARCERATION"],
  workflowsSystemsGatedByFeatureVariant: {
    INCARCERATION: ["usIdCRC", "usIdExpandedCRC"],
  },
  workflowsSystemConfigs: {
    INCARCERATION: {
      searchType: "LOCATION",
      searchField: "facilityId",
      searchTitleOverride: "facility",
    },
  },
  navigation: {
    // The order of pages here determines where the user will land first when navigating from `/`
    workflows: ["home", ...WORKFLOWS_OPPORTUNITY_TYPES, "clients", "tasks"],
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
    supervision: [
      PATHWAYS_SECTIONS.countOverTime,
      PATHWAYS_SECTIONS.countByLocation,
      PATHWAYS_SECTIONS.countBySupervisionLevel,
      PATHWAYS_SECTIONS.countByRace,
    ],
    supervisionToPrison: [
      PATHWAYS_SECTIONS.countOverTime,
      PATHWAYS_SECTIONS.countByLengthOfStay,
      PATHWAYS_SECTIONS.countByLocation,
      // TODO #3088 Re-enable officer chart when data is ready
      // PATHWAYS_SECTIONS.countByOfficer,
      PATHWAYS_SECTIONS.countBySupervisionLevel,
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
    methodology: ["system", "operations"],
  },
  tableColumns: enabledTableColumns[pathways.US_ID],
  vitalsMetrics: [
    {
      name: METRIC_TYPE_LABELS.OVERALL,
      id: METRIC_TYPES.OVERALL,
      description: "Average timeliness across all metrics",
      accessor: "overall",
    },
    {
      name: METRIC_TYPE_LABELS.RISK_ASSESSMENT,
      id: METRIC_TYPES.RISK_ASSESSMENT,
      description: `of clients have an up-to-date risk assessment, according to IDOC policy.`,
      accessor: "timelyRiskAssessment",
    },
    {
      name: METRIC_TYPE_LABELS.F2F_CONTACT,
      id: METRIC_TYPES.CONTACT,
      description: `of clients have an up-to-date face-to-face contact, according to IDOC policy`,
      accessor: "timelyContact",
    },
    {
      name: METRIC_TYPE_LABELS.DOWNGRADE,
      id: METRIC_TYPES.DOWNGRADE,
      description: `of clients are at a supervision level that is the same or below their risk level.`,
      accessor: "timelyDowngrade",
    },
  ],
};

export default US_ID_CONFIG;