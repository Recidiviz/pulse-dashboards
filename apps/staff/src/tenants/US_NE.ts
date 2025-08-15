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
import * as dashboard from "../RootStore/TenantStore/dashboardTenants";
import UsNeAssessmentTask from "../WorkflowsStore/Task/US_NE/UsNeAssessmentTask";
import UsNeCollateralContactTask from "../WorkflowsStore/Task/US_NE/UsNeCollateralContactTask";
import UsNeNCJISCheckContactTask from "../WorkflowsStore/Task/US_NE/UsNeNCJISCheckContactTask";
import UsNeOrasAssessmentTask from "../WorkflowsStore/Task/US_NE/UsNeOrasAssessmentTask";
import UsNePersonalContactTask from "../WorkflowsStore/Task/US_NE/UsNePersonalContactTask";
import UsNeStableAssessmentTask from "../WorkflowsStore/Task/US_NE/UsNeStableAssessmentTask";

const US_NE_CONFIG: TenantConfig<"US_NE"> = {
  name: "Nebraska",
  stateCode: "NE",
  domain: "corrections.nebraska.gov",
  availableStateCodes: [dashboard.US_NE],
  enableUserRestrictions: false,
  workflowsSupportedSystems: ["SUPERVISION"],
  workflowsMethodologyUrl:
    "https://drive.google.com/file/d/1PuZnoNTddYoKVA0CSpRDoNvCIBWJxg_I/view",
  workflowsTasksConfig: {
    collection: "usNeSupervisionTasks",
    pageDescriptionMarkdown: `Overdue and upcoming due dates for personal contacts, collateral contacts, NCJIS Checks, and ORAS Assessments for clients are listed below.
      See [“How it works”](https://drive.google.com/file/d/1PuZnoNTddYoKVA0CSpRDoNvCIBWJxg_I/view) to learn more.`,
    tasks: {
      usNeAssessment: {
        // TODO(#9302) delete this
        constructor: UsNeAssessmentTask,
        snoozeForOptionsInDays: [7, 30, 90],
      },
      usNeOrasAssessment: {
        constructor: UsNeOrasAssessmentTask,
        snoozeForOptionsInDays: [7, 30, 90],
      },
      usNeStableAssessment: {
        constructor: UsNeStableAssessmentTask,
        snoozeForOptionsInDays: [7, 30, 90],
      },
      usNePersonalContact: {
        constructor: UsNePersonalContactTask,
        snoozeForOptionsInDays: [7, 30, 90],
      },
      usNeCollateralContact: {
        constructor: UsNeCollateralContactTask,
        snoozeForOptionsInDays: [7, 30, 90],
      },
      usNeNCJISCheckContact: {
        constructor: UsNeNCJISCheckContactTask,
        snoozeForOptionsInDays: [7, 30, 90],
      },
    },
    categories: ["OVERDUE", "DUE_THIS_MONTH", "DUE_NEXT_MONTH", "HIDDEN"],
    columns: [
      "name",
      "id",
      "frequency",
      "task",
      "dueDate",
      "caseType",
      "supervisionLevel",
      "city",
      "zip",
      "assignedTo",
    ],
    sideBarComponents: [
      "Supervision",
      "Contact",
      "UsNeORASScores",
      "UsNeSpecialConditions",
      "ActiveSentences",
    ],
    filters: [
      {
        title: "Task Type",
        field: "type",
        type: "task",
        options: [
          {
            value: "usNeOrasAssessment",
            label: "ORAS Assessment",
          },
          {
            value: "usNeStableAssessment",
            label: "STABLE Assessment",
          },
          {
            value: "usNePersonalContact",
            label: "Personal Contact",
          },
          {
            value: "usNeCollateralContact",
            label: "Collateral Contact",
          },
          {
            value: "usNeNCJISCheckContact",
            label: "NCJIS Check",
          },
        ],
      },
      // TODO: Need to figure out formatting
      // {
      //   title: "Supervision Level",
      //   field: "supervisionLevel",
      //   type: "person",
      //   options: [],
      // },
      {
        title: "Case Type",
        field: "caseType",
        type: "person",
        options: [
          { value: "General" },
          { value: "Sex offense" },
          { value: "Domestic violence" },
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
  },
  navigation: {
    workflows: ["home", "clients", "tasks"],
  },
  supervisionEndCopyOverride: "Tentative Release Date",
  supervisionDisplayIdCopy: "NDCS ID",
};

export default US_NE_CONFIG;
