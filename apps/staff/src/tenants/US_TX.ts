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
import usTxCollateralContactScheduled from "../WorkflowsStore/Task/UsTxCollateralContactScheduled";
import UsTxElectronicContactScheduledTask from "../WorkflowsStore/Task/UsTxElectronicContactScheduledTask";
import UsTxElectronicContactUnscheduledTask from "../WorkflowsStore/Task/UsTxElectronicContactUnscheduledTask";
import UsTxFieldContactScheduledTask from "../WorkflowsStore/Task/UsTxFieldContactScheduledTask";
import UsTxFieldContactUnscheduledTask from "../WorkflowsStore/Task/UsTxFieldContactUnscheduledTask";
import usTxHomeContactEdgeCaseTask from "../WorkflowsStore/Task/UsTxHomeContactEdgeCaseTask";
import usTxHomeContactScheduledTask from "../WorkflowsStore/Task/UsTxHomeContactScheduledTask";
import usTxHomeContactUnscheduledTask from "../WorkflowsStore/Task/UsTxHomeContactUnscheduledTask";
import UsTxOfficeContactScheduledTask from "../WorkflowsStore/Task/UsTxOfficeContactScheduledTask";
import usTxTypeAgnosticContactTask from "../WorkflowsStore/Task/UsTxTypeAgnosticContactTask";

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
      usTxCollateralContactScheduled: {
        constructor: usTxCollateralContactScheduled,
        snoozeForOptionsInDays: [7, 30, 90],
      },
      usTxTypeAgnosticContact: {
        constructor: usTxTypeAgnosticContactTask,
        snoozeForOptionsInDays: [7, 30, 90],
      },
      usTxHomeContactScheduled: {
        constructor: usTxHomeContactScheduledTask,
        snoozeForOptionsInDays: [7, 30, 90],
      },
      usTxHomeContactUnscheduled: {
        constructor: usTxHomeContactUnscheduledTask,
        snoozeForOptionsInDays: [7, 30, 90],
      },
      usTxHomeContactEdgeCase: {
        constructor: usTxHomeContactEdgeCaseTask,
        snoozeForOptionsInDays: [7, 30, 90],
      },
      usTxOfficeContactScheduled: {
        constructor: UsTxOfficeContactScheduledTask,
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
        title: "Contact Type",
        field: "type",
        type: "task",
        options: [
          {
            value: "usTxCollateralContactScheduled",
            label: "Collateral Contact",
          },
          {
            value: "usTxHomeContactScheduled",
            label: "Home Contact, Sch.",
          },
          {
            value: "usTxHomeContactUnscheduled",
            label: "Home Contact, Unsch.",
          },
          {
            value: "usTxHomeContactEdgeCase",
            label: "Home Contact, Misc.",
          },
          {
            value: "usTxOfficeContactScheduled",
            label: "Office Contact",
          },
          {
            value: "usTxFieldContactScheduled",
            label: "Field Contact, Sch.",
          },
          {
            value: "usTxFieldContactUnscheduled",
            label: "Field Contact, Unsch.",
          },
          {
            value: "usTxElectronicContactScheduled",
            label: "Electronic Contact, Sch.",
          },
          {
            value: "usTxElectronicContactUnscheduled",
            label: "Electronic Contact, Unsch.",
          },
          {
            value: "usTxTypeAgnosticContact",
            label: "Generic Contact",
          },
          {
            value: "usTxAssessment",
            label: "Assessments",
          },
        ],
      },
      {
        title: "Supervision Level",
        field: "supervisionLevel",
        type: "person",
        options: [
          {
            value: "Annual",
          },
          {
            value: "Low",
          },
          {
            value: "Low-Moderate",
          },
          {
            value: "Medium",
          },
          {
            value: "High",
          },
          {
            value: "In-custody",
          },
        ],
      },
      {
        title: "Case Type",
        field: "caseType",
        type: "person",
        options: [
          {
            value: "Regular",
          },
          {
            value: "Annual",
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
          {
            value: "Medically recommended intensive supervision",
          },
          {
            value: "Non-reporting",
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
