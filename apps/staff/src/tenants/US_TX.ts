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
import UsTxAssessmentTask from "../WorkflowsStore/Task/US_TX/UsTxAssessmentTask";
import usTxCollateralContactScheduled from "../WorkflowsStore/Task/US_TX/UsTxCollateralContactScheduled";
import UsTxElectronicContactScheduledTask from "../WorkflowsStore/Task/US_TX/UsTxElectronicContactScheduledTask";
import UsTxElectronicContactUnscheduledTask from "../WorkflowsStore/Task/US_TX/UsTxElectronicContactUnscheduledTask";
import UsTxFieldContactScheduledTask from "../WorkflowsStore/Task/US_TX/UsTxFieldContactScheduledTask";
import UsTxFieldContactUnscheduledTask from "../WorkflowsStore/Task/US_TX/UsTxFieldContactUnscheduledTask";
import usTxHomeContactEdgeCaseTask from "../WorkflowsStore/Task/US_TX/UsTxHomeContactEdgeCaseTask";
import usTxHomeContactScheduledTask from "../WorkflowsStore/Task/US_TX/UsTxHomeContactScheduledTask";
import usTxHomeContactUnscheduledTask from "../WorkflowsStore/Task/US_TX/UsTxHomeContactUnscheduledTask";
import UsTxInCustodyContactTask from "../WorkflowsStore/Task/US_TX/UsTxInCustodyContactTask";
import UsTxOfficeContactScheduledTask from "../WorkflowsStore/Task/US_TX/UsTxOfficeContactScheduledTask";
import usTxTypeAgnosticContactTask from "../WorkflowsStore/Task/US_TX/UsTxTypeAgnosticContactTask";

const US_TX_CONFIG: TenantConfig<"US_TX"> = {
  name: "Texas",
  stateCode: "TX",
  domain: "tdcj.texas.gov",
  availableStateCodes: [dashboard.US_TX],
  enableUserRestrictions: false,
  workflowsSupportedSystems: ["SUPERVISION"],
  workflowsHomepage: "tasks",
  workflowsHomepageName: "Tasks",
  workflowsMethodologyUrl:
    "https://docs.google.com/document/d/e/2PACX-1vQamrgWtwG-kUfm6sBTRjRCYlFAZmMUQRHvoZ-fLU_YO0YfEElrVG7Rgq9NFdIq-NbcD_aILsZvWT2Z/pub",
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
      usTxInCustodyContact: {
        constructor: UsTxInCustodyContactTask,
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
      usTxElectronicOrOfficeContact: {
        constructor: usTxTypeAgnosticContactTask,
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
            shortLabel: "Home Contact, Sch.",
            label: "Home Contact, Scheduled",
          },
          {
            value: "usTxHomeContactUnscheduled",
            shortLabel: "Home Contact, Unsch.",
            label: "Home Contact, Unscheduled",
          },
          {
            value: "usTxHomeContactEdgeCase",
            shortLabel: "Home Contact, Misc.",
            label: "Home Contact, Miscellaneous",
          },
          {
            value: "usTxInCustodyContact",
            label: "In-Custody Contact",
          },
          {
            value: "usTxOfficeContactScheduled",
            label: "Office Contact",
          },
          {
            value: "usTxFieldContactScheduled",
            shortLabel: "Field Contact, Sch.",
            label: "Field Contact, Scheduled",
          },
          {
            value: "usTxFieldContactUnscheduled",
            shortLabel: "Field Contact, Unsch.",
            label: "Field Contact, Unscheduled",
          },
          {
            value: "usTxElectronicContactScheduled",
            shortLabel: "Electronic Contact, Sch.",
            label: "Electronic Contact, Scheduled",
          },
          {
            value: "usTxElectronicContactUnscheduled",
            shortLabel: "Electronic Contact, Unsch.",
            label: "Electronic Contact, Unscheduled",
          },
          {
            value: "usTxElectronicOrOfficeContact",
            label: "Electronic or Office Contact",
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
            value: "Moderate",
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
            value: "Substance abuse - phase 1",
          },
          {
            value: "Substance abuse - phase 2",
          },
          {
            value: "Substance abuse - phase 3",
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
