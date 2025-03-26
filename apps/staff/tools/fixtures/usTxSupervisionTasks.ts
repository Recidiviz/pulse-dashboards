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
          typeOfContact: "UNSCHEDULED HOME",
          frequency: "4 MONTHS",
        },
      },
      {
        type: "usTxElectronicContactUnscheduled",
        // overdue
        dueDate: "2022-09-23",
        details: {
          contactCount: 2,
          lastContactDate: "2022-06-23",
          overdueFlag: true,
          typeOfContact: "UNSCHEDULED ELECTRONIC",
          frequency: "3 MONTHS",
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
          frequency: "12 MONTHS",
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
          frequency: "12 MONTHS",
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
