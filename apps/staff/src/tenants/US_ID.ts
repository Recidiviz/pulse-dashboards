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
import UsIdContactTask from "../WorkflowsStore/Task/US_ID/UsIdContactTask";
import UsIdEmploymentVerificationTask from "../WorkflowsStore/Task/US_ID/UsIdEmploymentVerificationTask";
import UsIdEmploymentVerificationTaskV2 from "../WorkflowsStore/Task/US_ID/UsIdEmploymentVerificationTaskV2";
import UsIdFaceToFaceContactTask from "../WorkflowsStore/Task/US_ID/UsIdFaceToFaceContactTask";
import UsIdHomeVisitTask from "../WorkflowsStore/Task/US_ID/UsIdHomeVisitTask";
import UsIdHomeVisitTaskV2 from "../WorkflowsStore/Task/US_ID/UsIdHomeVisitTaskV2";
import UsIdRiskAssessmentTask from "../WorkflowsStore/Task/US_ID/UsIdRiskAssessmentTask";
import UsIdRiskAssessmentTaskV2 from "../WorkflowsStore/Task/US_ID/UsIdRiskAssessmentTaskV2";
import { filterByUserDistrict } from "../WorkflowsStore/utils";

const US_ID_CONFIG = {
  name: "Idaho",
  stateCode: "ID",
  domain: "idoc.idaho.gov",
  DOCName: "IDOC",
  availableStateCodes: [pathways.US_ID],
  enableUserRestrictions: false,
  workflowsStaffFilterFn: filterByUserDistrict,
  workflowsMethodologyUrl:
    "https://drive.google.com/file/d/1pum9mrOIvGoBIwwE3dQEITod7O5mcYGm/view?usp=sharing",
  workflowsTasksConfig: {
    collection: "usIdSupervisionTasks",
    methodologyUrl:
      "https://docs.google.com/document/d/1BmzbVFUQhbWOs9IOwR-gykUHNtZin5iUyzPdn8zRdx4/edit",
    pageDescriptionMarkdown:
      "The clients below might have upcoming requirements this month. Hiding a below task will not change an officer's timeliness percentage in the Operations metrics.",
    tasks: {
      usIdFaceToFaceContact: {
        constructor: UsIdFaceToFaceContactTask,
        snoozeForOptionsInDays: [7, 30, 90],
      },
      usIdHomeVisit: {
        constructor: UsIdHomeVisitTaskV2,
        snoozeForOptionsInDays: [7, 30, 90],
      },
      usIdEmploymentVerification: {
        constructor: UsIdEmploymentVerificationTaskV2,
        snoozeForOptionsInDays: [7, 30, 90],
      },
      usIdRiskAssessment: {
        constructor: UsIdRiskAssessmentTaskV2,
        snoozeForOptionsInDays: [7, 30, 90],
      },
      // Legacy Tasks - TODO(#10615): Remove when UsIdTasksV2 is fully rolled out.
      assessment: {
        constructor: UsIdRiskAssessmentTask,
        snoozeForOptionsInDays: [7, 30, 90],
      },
      // Legacy Tasks - TODO(#10615): Remove when UsIdTasksV2 is fully rolled out.
      contact: {
        constructor: UsIdContactTask,
        snoozeForOptionsInDays: [7, 30, 90],
      },
      // Legacy Tasks - TODO(#10615): Remove when UsIdTasksV2 is fully rolled out.
      homeVisit: {
        constructor: UsIdHomeVisitTask,
        snoozeForOptionsInDays: [7, 30, 90],
      },
      // Legacy Tasks - TODO(#10615): Remove when UsIdTasksV2 is fully rolled out.
      employment: {
        constructor: UsIdEmploymentVerificationTask,
        snoozeForOptionsInDays: [7, 30, 90],
      },
    },
    categories: [
      "ALL_TASKS_OLD",
      "assessment",
      "contact",
      "homeVisit",
      "employment",
    ],
    filters: [
      {
        title: "Supervision Level",
        field: "supervisionLevel",
        type: "person",
        options: [
          {
            value: "Low",
          },
          {
            value: "Moderate",
          },
          {
            value: "High",
          },
        ],
      },
      {
        title: "Task Type",
        field: "type",
        type: "task",
        options: [
          {
            value: "usIdFaceToFaceContact",
            label: "Contact",
          },
          {
            value: "usIdHomeVisit",
            shortLabel: "Home Visit",
            label: "Home Visit",
          },
          {
            value: "usIdRiskAssessment",
            shortLabel: "Risk Assessment",
            label: "Risk Assessment",
          },
          {
            value: "usIdEmploymentVerification",
            shortLabel: "Employment Verification",
            label: "Employment Verification",
          },
        ],
      },
    ],
  },
  workflowsSupportedSystems: ["SUPERVISION", "INCARCERATION"],
  workflowsSystemConfigs: {
    INCARCERATION: {
      search: [
        {
          searchType: "US_ID_CRC_FACILITY",
          searchField: ["metadata", "crcFacilities"],
          searchTitle: "facility",
          searchOp: "array-contains-any",
          onlySurfaceEligible: true,
          restrictedToFeatureVariant: "usIdCRCFacilitySearch",
        },
        {
          searchType: "INCARCERATION_OFFICER",
          searchField: ["officerId"],
          searchTitle: "case manager",
          restrictedToFeatureVariant: "usIdCaseManagerSearch",
        },
      ],
    },
    SUPERVISION: {
      search: [
        {
          searchType: "DISTRICT",
          searchField: ["district"],
          searchTitle: "District",
          restrictedToFeatureVariant: "usIdDistrictSearch",
        },
        {
          searchType: "OFFICER",
          searchField: ["officerId"],
          searchTitle: "supervision officer",
        },
      ],
    },
  },
  navigation: {
    // The order of pages here determines where the user will land first when navigating from `/`
    insights: [INSIGHTS_PAGES.supervision],
    workflows: ["home", "clients", "tasks", "residents"],
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
    psi: [],
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
  releaseDateCopyOverride: "Full Term Release Date",
  featureVariants: {
    outcomesModule: {},
  },
} satisfies TenantConfig<"US_ID">;

export default US_ID_CONFIG;
