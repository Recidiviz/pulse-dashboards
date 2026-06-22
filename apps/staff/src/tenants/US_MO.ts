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

import { PATHWAYS_PAGES, PATHWAYS_SECTIONS } from "~shared-pathways";

import { TenantConfig } from "../core/models/types";
import enabledTableColumns from "../core/utils/enabledTableColumns";
import * as pathways from "../RootStore/TenantStore/pathwaysTenants";
import UsMoEmploymentVerificationTask from "../WorkflowsStore/Task/US_MO/UsMoEmploymentVerificationTask";
import UsMoInitialEmploymentVerificationIapTask from "../WorkflowsStore/Task/US_MO/UsMoInitialEmploymentVerificationIapTask";
import UsMoInitialPositiveContactWithSignificantOtherIapTask from "../WorkflowsStore/Task/US_MO/UsMoInitialPositiveContactWithSignificantOtherIapTask";
import UsMoInitialPositiveContactWithSignificantOtherSmiTask from "../WorkflowsStore/Task/US_MO/UsMoInitialPositiveContactWithSignificantOtherSmiTask";
import UsMoInitialPositiveHomeVisitIapTask from "../WorkflowsStore/Task/US_MO/UsMoInitialPositiveHomeVisitIapTask";
import UsMoInitialPositiveHomeVisitSmiTask from "../WorkflowsStore/Task/US_MO/UsMoInitialPositiveHomeVisitSmiTask";
import UsMoInPersonContactTask from "../WorkflowsStore/Task/US_MO/UsMoInPersonContactTask";
import UsMoPositiveContactWithSignificantOtherTask from "../WorkflowsStore/Task/US_MO/UsMoPositiveContactWithSignificantOtherTask";
import UsMoPositiveHomeVisitTask from "../WorkflowsStore/Task/US_MO/UsMoPositiveHomeVisitTask";

const US_MO_CONFIG = {
  name: "Missouri",
  stateCode: "MO",
  domain: "doc.mo.gov",
  availableStateCodes: [pathways.US_MO],
  enableUserRestrictions: true,
  workflowsSupportedSystems: ["SUPERVISION", "INCARCERATION"],
  workflowsMethodologyUrl:
    "https://docs.google.com/document/d/e/2PACX-1vToMOcOU3qmUUF9J86R4MaqjcZIogwq5FwuqWqWLFiY2cPCsgq98E_HgbQ5PPJWexRT-n7pWqcqY5Xz/pub",
  workflowsTasksConfig: {
    collection: "usMoSupervisionTasks",
    tasks: {
      usMoEmploymentVerification: {
        constructor: UsMoEmploymentVerificationTask,
        snoozeForOptionsInDays: [7, 30, "FOREVER"],
      },
      usMoInitialEmploymentVerificationIap: {
        constructor: UsMoInitialEmploymentVerificationIapTask,
        snoozeForOptionsInDays: [7, 30],
      },
      usMoInitialPositiveContactWithSignificantOtherIap: {
        constructor: UsMoInitialPositiveContactWithSignificantOtherIapTask,
        snoozeForOptionsInDays: [7, 30, 90],
      },
      usMoInitialPositiveContactWithSignificantOtherSmi: {
        constructor: UsMoInitialPositiveContactWithSignificantOtherSmiTask,
        snoozeForOptionsInDays: [7, 30, 90],
      },
      usMoInitialPositiveHomeVisitIap: {
        constructor: UsMoInitialPositiveHomeVisitIapTask,
        snoozeForOptionsInDays: [7, 30],
      },
      usMoInitialPositiveHomeVisitSmi: {
        constructor: UsMoInitialPositiveHomeVisitSmiTask,
        snoozeForOptionsInDays: [7, 30],
      },
      usMoPositiveHomeVisit: {
        constructor: UsMoPositiveHomeVisitTask,
        snoozeForOptionsInDays: [7, 30],
      },
      usMoInPersonContact: {
        constructor: UsMoInPersonContactTask,
        snoozeForOptionsInDays: [7, 30],
      },
      usMoPositiveContactWithSignificantOther: {
        constructor: UsMoPositiveContactWithSignificantOtherTask,
        snoozeForOptionsInDays: [7, 30, 90],
      },
    },
    pageDescriptionMarkdown:
      "The clients below might have upcoming contact requirements.",
    columns: [
      "name",
      "id",
      "task",
      "dueDate",
      "frequency",
      "supervisionLevel",
      "caseType",
    ],
    categories: ["DUE_THIS_MONTH", "DUE_NEXT_MONTH", "OVERDUE"],
    filters: [
      {
        title: "Task Type",
        field: "type",
        type: "task",
        options: [
          {
            value: "usMoEmploymentVerification",
            label: "EC/PEV",
          },
          {
            value: "usMoInitialEmploymentVerificationIap",
            label: "Initial EC/PEV (IAP)",
          },
          {
            value: "usMoPositiveContactWithSignificantOther",
            label: "Positive Contact with Significant Other",
            shortLabel: "PSO",
          },
          {
            value: "usMoInitialPositiveContactWithSignificantOtherIap",
            label: "Initial Positive Contact with Significant Other (IAP)",
            shortLabel: "Initial PSO (IAP)",
          },
          {
            value: "usMoInitialPositiveContactWithSignificantOtherSmi",
            label: "Initial Positive Contact with Significant Other (SMI)",
            shortLabel: "Initial PSO (SMI)",
          },
          {
            value: "usMoPositiveHomeVisit",
            label: "Positive Home Visit",
            shortLabel: "PHV",
          },
          {
            value: "usMoInitialPositiveHomeVisitIap",
            label: "Initial Positive Home Visit (IAP)",
            shortLabel: "Initial PHV (IAP)",
          },
          {
            value: "usMoInitialPositiveHomeVisitSmi",
            label: "Initial Positive Home Visit (SMI)",
            shortLabel: "Initial PHV (SMI)",
          },
          {
            value: "usMoInPersonContact",
            label: "In-Person Contact",
          },
          {
            // Synthetic task-type assigned to user-authored custom tasks
            // by `CustomTasks.activeTaskItems`. Only takes effect when
            // the `customTasks` feature variant is on for the user —
            // otherwise no row carries this `type` so selecting the
            // filter is a no-op.
            value: "customTask",
            label: "Custom Tasks",
          },
        ],
      },
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
          { value: "Maximum" },
        ],
      },
      {
        title: "Case Type",
        field: "caseType",
        type: "person",
        options: [
          {
            value: "General",
          },
          {
            value: "Domestic Violence",
          },
          {
            value: "ICTS Treatment Offender",
          },
          {
            value: "JRI Treatment Pilot Offender",
          },
          {
            value: "Parole Or Condition Release Less Than 12 Months",
            shortLabel: "Parole/Release <12 Months",
          },
          {
            value: "Serious Mental Illness Or Disability",
            shortLabel: "Mental Illness/Disability",
          },
          {
            value: "Sex Offense",
          },
          {
            value: "Specialty Court Offender",
          },
          {
            value: "Treatment Court Offender",
          },
        ],
      },
    ],
  },
  workflowsSystemConfigs: {
    SUPERVISION: {
      search: [
        {
          searchType: "OFFICER",
          searchField: ["officerId"],
          searchTitle: "officer",
        },
      ],
    },
    INCARCERATION: {
      search: [
        {
          searchType: "FACILITY",
          searchField: ["facilityId"],
          searchTitle: "institution",
        },
        {
          searchType: "FACILITY_UNIT",
          searchField: ["facilityUnitId"],
          searchTitle: "unit",
          restrictedToFeatureVariant: "usMoSearchByUnit",
        },
      ],
    },
  },
  navigation: {
    workflows: ["home", "tasks", "clients", "residents"],
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
    revocations: [],
    sar: [],
    methodology: ["system"],
  },
  tableColumns: enabledTableColumns[pathways.US_MO],
} satisfies TenantConfig<"US_MO">;

export default US_MO_CONFIG;
