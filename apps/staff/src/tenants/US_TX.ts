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
import UsTxAssessmentTask from "../WorkflowsStore/Task/UsTxAssessmentTask";
import UsTxElectronicContactScheduledTask from "../WorkflowsStore/Task/UsTxElectronicContactScheduledTask";
import UsTxElectronicContactUnscheduledTask from "../WorkflowsStore/Task/UsTxElectronicContactUnscheduledTask";
import UsTxFieldContactScheduledTask from "../WorkflowsStore/Task/UsTxFieldContactScheduledTask";
import UsTxFieldContactUnscheduledTask from "../WorkflowsStore/Task/UsTxFieldContactUnscheduledTask";
import usTxHomeContactScheduledTask from "../WorkflowsStore/Task/UsTxHomeContactScheduledTask";
import usTxHomeContactUnscheduledTask from "../WorkflowsStore/Task/UsTxHomeContactUnscheduledTask";

const US_TX_CONFIG: TenantConfig<"US_TX"> = {
  name: "Texas",
  stateCode: "TX",
  domain: "tdcj.texas.gov",
  availableStateCodes: [dashboard.US_TX],
  enableUserRestrictions: false,
  workflowsSupportedSystems: ["SUPERVISION"],
  workflowsHomepage: "tasks",
  workflowsHomepageName: "Tasks",
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
  workflowsTasksConfig: {
    collection: "usTxSupervisionTasks",
    tasks: {
      usTxHomeContactScheduled: {
        constructor: usTxHomeContactScheduledTask,
        snoozeForOptionsInDays: [7, 30, 90],
      },
      usTxHomeContactUnscheduled: {
        constructor: usTxHomeContactUnscheduledTask,
        snoozeForOptionsInDays: [7, 30, 90],
      },
      usTxFieldContactScheduled: {
        constructor: UsTxFieldContactScheduledTask,
        snoozeForOptionsInDays: [7, 30, 90],
      },
      usTxFieldContactUnscheduled: {
        constructor: UsTxFieldContactUnscheduledTask,
        snoozeForOptionsInDays: [7, 30, 90],
      },
      usTxElectronicContactScheduled: {
        constructor: UsTxElectronicContactScheduledTask,
        snoozeForOptionsInDays: [7, 30, 90],
      },
      usTxElectronicContactUnscheduled: {
        constructor: UsTxElectronicContactUnscheduledTask,
        snoozeForOptionsInDays: [7, 30, 90],
      },
      usTxAssessment: {
        constructor: UsTxAssessmentTask,
        snoozeForOptionsInDays: [7, 30, 90],
      },
    },
    filters: [
      {
        title: "Supervision Level",
        field: "supervisionLevel",
        options: [
          {
            value: "Limited",
          },
          {
            value: "Minimum",
          },
          {
            value: "Medium",
          },
          {
            value: "High",
          },
          {
            value: "Maximum",
          },
        ],
      },
      {
        title: "Case Type",
        field: "caseType",
        options: [
          {
            value: "Regular",
          },
          {
            value: "Sex offender",
          },
          {
            value: "Substance abuse",
          },
          {
            value: "Mentally ill",
          },
          {
            value: "Intellectually disabled",
          },
          {
            value: "Electronic monitoring",
          },
          {
            value: "Super-intensive supervision",
          },
          {
            value: "Day/district resource center",
          },
          {
            value: "Terminally ill / Physically handicapped",
          },
        ],
      },
    ],
  },
  navigation: {
    workflows: ["tasks", "clients"],
  },
};

export default US_TX_CONFIG;
