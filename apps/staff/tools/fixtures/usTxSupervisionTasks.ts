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

import { SupervisionTasksRecord } from "../../src/WorkflowsStore/Task/types";
import { FirestoreFixture } from "./utils";

const data: SupervisionTasksRecord<"US_TX">[] = [
  {
    stateCode: "US_TX",
    externalId: "001",
    officerId: "OFFICER1",
    tasks: [
      {
        type: "usTxHomeContactScheduled",
        // overdue
        dueDate: "2022-01-03",
        details: {
          contactCount: 2,
          lastContactDate: "2021-08-03",
          overdueFlag: true,
          typeOfContact: "SCHEDULED HOME",
          contactCadence: "4 MONTHS",
          officerInCriticallyUnderstaffedLocation: false,
        },
      },
      {
        type: "usTxCollateralContactScheduled",
        dueDate: "2023-02-10",
        details: {
          contactCount: 2,
          lastContactDate: "2022-08-10",
          overdueFlag: false,
          typeOfContact: "SCHEDULED COLLATERAL",
          contactCadence: "1 MONTH",
        },
      },
    ],
  },
  {
    stateCode: "US_TX",
    externalId: "002",
    officerId: "OFFICER1",
    tasks: [
      {
        type: "usTxHomeContactScheduled",
        // overdue
        dueDate: "2022-03-09",
        details: {
          contactCount: 2,
          lastContactDate: "2021-03-09",
          overdueFlag: true,
          typeOfContact: "SCHEDULED HOME",
          contactCadence: "12 MONTHS",
          officerInCriticallyUnderstaffedLocation: false,
        },
      },
      {
        type: "usTxFieldContactUnscheduled",
        // overdue
        dueDate: "2022-03-09",
        details: {
          contactCount: 2,
          lastContactDate: "2021-03-09",
          overdueFlag: false,
          typeOfContact: "UNSCHEDULED FIELD",
          contactCadence: "12 MONTHS",
        },
      },
      {
        type: "usTxAssessment",
        // overdue
        dueDate: "2022-10-09",
        details: {
          eventType: "supervision_start_no_prior_assessment",
          eventDate: "2022-06-09",
          dueAssessmentDate: "2022-10-09",
          frequency: "4 MONTHS",
        },
      },
    ],
  },
  {
    stateCode: "US_TX",
    externalId: "003",
    officerId: "OFFICER2",
    tasks: [
      {
        type: "usTxHomeContactEdgeCase",
        dueDate: "2022-03-12",
        details: {
          reasonForContact: "Initial Home Contact",
          contactCadence: "3 MONTHS",
        },
      },
      {
        type: "usTxHomeContactScheduled",
        dueDate: "2022-03-26",
        details: {
          overrideContactType: "SCHEDULED HOME (VIRTUAL)",
          officerInCriticallyUnderstaffedLocation: true,
          contactDueDate: "2022-03-26",
          lastContactDate: null,
          contactCount: 2,
          overdueFlag: false,
          typeOfContact: "SCHEDULED HOME",
          contactCadence: "2 MONTHS",
        },
      },
    ],
  },
  {
    stateCode: "US_TX",
    externalId: "004",
    officerId: "OFFICER2",
    tasks: [
      {
        type: "usTxHomeContactEdgeCase",
        dueDate: "2022-03-18",
        details: {
          reasonForContact: "Home Contact due to Address Change",
          contactCadence: "3 MONTHS",
        },
      },
      {
        type: "usTxHomeContactUnscheduled",
        dueDate: "2024-06-12",
        details: {
          overrideContactType: "UNSCHEDULED HOME (VIRTUAL)",
          officerInCriticallyUnderstaffedLocation: true,
          lastContactDate: null,
          contactCount: 2,
          overdueFlag: false,
          typeOfContact: "UNSCHEDULED HOME",
          contactCadence: "6 MONTHS",
        },
      },
    ],
  },
  {
    stateCode: "US_TX",
    externalId: "005",
    officerId: "OFFICER2",
    tasks: [
      {
        type: "usTxHomeContactUnscheduled",
        dueDate: "2020-03-19",
        details: {
          overrideContactType: "UNSCHEDULED HOME (VIRTUAL)",
          officerInCriticallyUnderstaffedLocation: true,
          lastContactDate: null,
          contactCount: 2,
          overdueFlag: false,
          typeOfContact: "UNSCHEDULED HOME",
          contactCadence: "6 MONTHS",
        },
      },
    ],
  },
  {
    stateCode: "US_TX",
    externalId: "006",
    officerId: "OFFICER1",
    tasks: [
      {
        type: "usTxInCustodyContact",
        dueDate: "2022-03-19",
        details: {
          contactCount: 2,
          lastContactDate: null,
          overdueFlag: false,
          typeOfContact: "UNSCHEDULED HOME",
          contactCadence: "12 MONTHS",
        },
      },
      {
        type: "usTxOfficeContactScheduled",
        dueDate: "2024-06-01",
        details: {
          contactCount: 2,
          lastContactDate: null,
          overdueFlag: false,
          typeOfContact: "OFFICE CONTACT",
          contactCadence: "12 MONTHS",
        },
      },
    ],
  },
  {
    stateCode: "US_TX",
    externalId: "007",
    officerId: "OFFICER3",
    tasks: [
      {
        type: "usTxFieldContactScheduled",
        dueDate: "2022-12-12",
        details: {
          contactCount: 2,
          lastContactDate: null,
          overdueFlag: false,
          typeOfContact: "FIELD CONTACT, SCHEDULED",
          contactCadence: "12 MONTHS",
        },
      },
    ],
  },
  {
    stateCode: "US_TX",
    externalId: "008",
    officerId: "OFFICER3",
    tasks: [
      {
        type: "usTxFieldContactUnscheduled",
        dueDate: "2022-06-11",
        details: {
          contactCount: 2,
          lastContactDate: null,
          overdueFlag: false,
          typeOfContact: "FIELD CONTACT, UNSCHEDULED",
          contactCadence: "12 MONTHS",
        },
      },
    ],
  },
  {
    stateCode: "US_TX",
    externalId: "009",
    officerId: "OFFICER4",
    tasks: [
      {
        type: "usTxVirtualOfficeContactScheduled",
        dueDate: "2022-02-10",
        details: {
          contactCount: 2,
          lastContactDate: "2022-01-10",
          overdueFlag: false,
          typeOfContact: "VIRTUAL OFFICE CONTACT, SCHEDULED",
          contactCadence: "1 MONTH",
        },
      },
    ],
  },
  {
    stateCode: "US_TX",
    externalId: "010",
    officerId: "OFFICER4",
    tasks: [
      {
        type: "usTxVirtualOfficeContactScheduled",
        dueDate: "2022-11-23",
        details: {
          contactCount: 2,
          lastContactDate: "2022-10-23",
          overdueFlag: false,
          typeOfContact: "VIRTUAL OFFICE CONTACT, UNSCHEDULED",
          contactCadence: "1 MONTH",
        },
      },
    ],
  },
  {
    stateCode: "US_TX",
    externalId: "011",
    officerId: "OFFICER4",
    tasks: [
      {
        type: "usTxAssessment",
        dueDate: "2022-12-30",
        details: {
          eventType: "supervision_start_no_prior_assessment",
          eventDate: "2022-12-30",
          dueAssessmentDate: "2022-12-30",
          frequency: "6 MONTHS",
        },
      },
    ],
  },
  {
    stateCode: "US_TX",
    externalId: "012",
    officerId: "OFFICER5",
    tasks: [
      {
        type: "usTxCollateralContactScheduled",
        dueDate: "2022-08-13",
        details: {
          contactCount: 2,
          lastContactDate: "2022-07-13",
          overdueFlag: false,
          typeOfContact: "SCHEDULED COLLATERAL",
          contactCadence: "1 MONTH",
        },
      },
    ],
  },
  {
    stateCode: "US_TX",
    externalId: "013",
    officerId: "OFFICER5",
    tasks: [
      {
        type: "usTxHomeContactScheduled",
        dueDate: "2020-09-14",
        details: {
          contactCount: 2,
          lastContactDate: "2022-03-14",
          overdueFlag: false,
          typeOfContact: "SCHEDULED HOME",
          contactCadence: "6 MONTHS",
          officerInCriticallyUnderstaffedLocation: false,
        },
      },
    ],
  },
  {
    stateCode: "US_TX",
    externalId: "014",
    officerId: "OFFICER5",
    tasks: [
      {
        type: "usTxHomeContactUnscheduled",
        dueDate: "2020-12-01",
        details: {
          overrideContactType: "UNSCHEDULED HOME (VIRTUAL)",
          officerInCriticallyUnderstaffedLocation: false,
          lastContactDate: "2020-06-01",
          contactCount: 2,
          overdueFlag: false,
          typeOfContact: "UNSCHEDULED HOME",
          contactCadence: "6 MONTHS",
        },
      },
    ],
  },
  {
    stateCode: "US_TX",
    externalId: "015",
    officerId: "OFFICER1",
    tasks: [
      {
        type: "usTxHomeContactEdgeCase",
        dueDate: "2023-11-30",
        details: {
          reasonForContact: "Initial Home Contact",
          contactCadence: "3 MONTHS",
        },
      },
    ],
  },
  {
    stateCode: "US_TX",
    externalId: "016",
    officerId: "OFFICER2",
    tasks: [
      {
        type: "usTxOfficeContactScheduled",
        dueDate: "2022-06-01",
        details: {
          contactCount: 2,
          lastContactDate: null,
          overdueFlag: false,
          typeOfContact: "OFFICE CONTACT",
          contactCadence: "12 MONTHS",
        },
      },
    ],
  },
  {
    stateCode: "US_TX",
    externalId: "017",
    officerId: "OFFICER3",
    tasks: [
      {
        type: "usTxVirtualOrOfficeContact",
        dueDate: "2022-01-01",
        details: {
          contactCount: 2,
          lastContactDate: null,
          overdueFlag: false,
          typeOfContact: "VIRTUAL CONTACT",
          contactCadence: "2 MONTHS",
        },
      },
    ],
  },
  {
    stateCode: "US_TX",
    externalId: "018",
    officerId: "OFFICER4",
    tasks: [
      {
        type: "usTxAssessment",
        dueDate: "2021-12-21",
        details: {
          eventType: "supervision_start_no_prior_assessment",
          eventDate: "2021-12-21",
          dueAssessmentDate: "2021-12-21",
          frequency: "4 MONTHS",
        },
      },
    ],
  },
];

export const usTxSupervisionTasksData: FirestoreFixture<
  SupervisionTasksRecord<"US_TX">
> = {
  data,
  idFunc: (r) => r.externalId,
};
