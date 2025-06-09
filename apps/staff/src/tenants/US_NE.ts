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
    tasks: {
      usNeAssessment: {
        constructor: UsNeAssessmentTask,
        snoozeForOptionsInDays: [7, 30, 90],
      },
    },
    filters: [
      {
        title: "Task Type",
        field: "type",
        type: "task",
        options: [
          {
            value: "usNeAssessment",
            label: "ORAS Assessment",
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
};

export default US_NE_CONFIG;
