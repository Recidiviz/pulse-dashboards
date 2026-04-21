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
import { INSIGHTS_PAGES } from "../core/views";
import * as dashboard from "../RootStore/TenantStore/dashboardTenants";
import UsTxAssessmentTask from "../WorkflowsStore/Task/US_TX/UsTxAssessmentTask";
import UsTxContactTask from "../WorkflowsStore/Task/US_TX/UsTxContactTask";
import usTxHomeContactEdgeCaseTask from "../WorkflowsStore/Task/US_TX/UsTxHomeContactEdgeCaseTask";
import usTxTypeAgnosticContactTask from "../WorkflowsStore/Task/US_TX/UsTxTypeAgnosticContactTask";

const US_TX_CONFIG = {
  name: "Texas",
  stateCode: "TX",
  domain: "tdcj.texas.gov",
  availableStateCodes: [dashboard.US_TX],
  enableUserRestrictions: false,
  supervisionDisplayIdCopy: "SID",
  workflowsSupportedSystems: ["SUPERVISION"],
  workflowsHomepage: "home",
  workflowsHomepageName: "Opportunities",
  workflowsMethodologyUrl:
    "https://docs.google.com/document/d/e/2PACX-1vQ2vXowyvhHi5o0NZsWBlQbmTveRcirOsOBghxbv_1JjhMZyMnL-RAJ9VwMuMMsLmSXwpoF6N1SvkLm/pub",
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
    methodologyUrl:
      "https://docs.google.com/document/d/e/2PACX-1vQamrgWtwG-kUfm6sBTRjRCYlFAZmMUQRHvoZ-fLU_YO0YfEElrVG7Rgq9NFdIq-NbcD_aILsZvWT2Z/pub",
    pageDescriptionMarkdown: `The clients listed below have upcoming requirements due this month
          that have not yet been completed. Data is refreshed from OIMS nightly.
          For more information on how this tool calculates contacts & due dates
          for most offices click [here](https://docs.google.com/document/d/e/2PACX-1vQamrgWtwG-kUfm6sBTRjRCYlFAZmMUQRHvoZ-fLU_YO0YfEElrVG7Rgq9NFdIq-NbcD_aILsZvWT2Z/pub)
          and for designated 'Critically Understaffed' offices click
          [here](https://docs.google.com/document/d/e/2PACX-1vTIXGLHHXQ0STYmapw4pzAcW3j3I8455jaaEH6d61-btlzkiPzS-GQaYJu3aG32o8B1i1mzRWwXbHbV/pub).
          To read official TDCJ policy about completing TRAS, click [here](https://www.tdcj.texas.gov/documents/pd/03.02.05_parole_policy.pdf).
          To read official TDCJ policy about the Initial Interview and Final Summary, click [here](https://www.tdcj.texas.gov/documents/pd/03.01.01_parole_policy.pdf).`,
    tasks: {
      usTxCollateralContactScheduled: {
        constructor: UsTxContactTask,
        snoozeForOptionsInDays: [7, 30, 90],
      },
      usTxTypeAgnosticContact: {
        constructor: usTxTypeAgnosticContactTask,
        snoozeForOptionsInDays: [7, 30, 90],
      },
      usTxHomeContactScheduled: {
        constructor: UsTxContactTask,
        snoozeForOptionsInDays: [7, 30, 90],
      },
      usTxHomeContactUnscheduled: {
        constructor: UsTxContactTask,
        snoozeForOptionsInDays: [7, 30, 90],
      },
      usTxHomeContactEdgeCase: {
        constructor: usTxHomeContactEdgeCaseTask,
        snoozeForOptionsInDays: [7, 30, 90],
      },
      usTxInCustodyContact: {
        constructor: UsTxContactTask,
        snoozeForOptionsInDays: [7, 30, 90],
      },
      usTxOfficeContactScheduled: {
        constructor: UsTxContactTask,
        snoozeForOptionsInDays: [7, 30, 90],
      },
      usTxFieldContactScheduled: {
        constructor: UsTxContactTask,
        snoozeForOptionsInDays: [7, 30, 90],
      },
      usTxVirtualOfficeContactScheduled: {
        constructor: UsTxContactTask,
        snoozeForOptionsInDays: [7, 30, 90],
      },
      usTxVirtualOrOfficeContact: {
        constructor: usTxTypeAgnosticContactTask,
        snoozeForOptionsInDays: [7, 30, 90],
      },
      usTxAssessment: {
        constructor: UsTxAssessmentTask,
        snoozeForOptionsInDays: [7, 30, 90],
      },
    },
    columns: [
      "name",
      "id",
      "frequency",
      "task",
      "dueDate",
      "caseType",
      "supervisionLevel",
      "assignedTo",
      "appointmentStatus",
    ],
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
            shortLabel: "Home Contact, Sched.",
            label: "Home Contact, Scheduled",
          },
          {
            value: "usTxHomeContactUnscheduled",
            shortLabel: "Home Contact, Unsched.",
            label: "Home Contact, Unscheduled",
          },
          {
            value: "usTxHomeContactEdgeCase",
            shortLabel: "Residence Validation",
            label: "Residence Validation",
          },
          {
            value: "usTxInCustodyContact",
            label: "Investigative Contact",
          },
          {
            value: "usTxOfficeContactScheduled",
            label: "Office Contact",
          },
          {
            value: "usTxFieldContactScheduled",
            shortLabel: "Field Contact, Sched.",
            label: "Field Contact, Scheduled",
          },
          {
            value: "usTxVirtualOfficeContactScheduled",
            label: "Virtual Contact",
          },
          {
            value: "usTxVirtualOrOfficeContact",
            shortLabel: "Virtual or Addnl. Office Contact",
            label: "Virtual or Additional Office Contact",
          },
          {
            value: "usTxTypeAgnosticContact",
            label: "Other Contact",
          },
          {
            value: "usTxAssessment",
            label: "TRAS",
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
          {
            value: "Unassigned",
          },
        ],
      },
      {
        title: "Case Type",
        field: "caseTypeForFilter",
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
            value: "Terminally ill / physically handicapped",
            shortLabel: "Term. ill / Phys. handicapped",
            label: "Terminally ill / Physically handicapped",
          },
          {
            value: "Medically recommended intensive supervision",
            shortLabel: "Medically rec'd intensive supv.",
            label: "Medically recommended intensive supervision",
          },
          {
            value: "Non-reporting",
          },
        ],
      },
      {
        title: "Appointment status",
        field: "hasFutureScheduledContact",
        type: "task",
        options: [
          {
            value: true,
            label: "Upcoming appointment",
          },
          {
            value: false,
            label: "Not yet scheduled",
          },
        ],
      },
    ],
  },
  navigation: {
    insights: [INSIGHTS_PAGES.supervision],
    workflows: ["home", "tasks", "clients"],
  },
} satisfies TenantConfig<"US_TX">;

export default US_TX_CONFIG;
