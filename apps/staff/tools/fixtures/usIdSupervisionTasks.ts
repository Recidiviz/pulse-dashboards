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

const data: SupervisionTasksRecord<"US_ID">[] = [
  {
    stateCode: "US_ID",
    externalId: "004",
    officerId: "OFFICER6",
    tasks: [
      {
        type: "homeVisit",
        // overdue
        dueDate: "2021-11-28",
        details: {
          caseType: "GENERAL",
          lastHomeVisit: "2021-05-29",
          supervisionLevel: "MINIMUM",
          currentAddress: "100 Proplantination Drive",
        },
      },
      {
        type: "employment",
        dueDate: "2021-12-18",
        details: {
          lastAssessedOn: "2021-06-18",
          riskLevel: "MINIMUM",
        },
      },
    ],
    needs: [],
  },
  {
    stateCode: "US_ID",
    externalId: "007",
    officerId: "OFFICER6",
    tasks: [
      {
        type: "contact",
        // upcoming
        dueDate: "2022-01-17",
        details: {
          caseType: "GENERAL",
          lastContacted: "2021-12-18",
          supervisionLevel: "HIGH",
        },
      },
      {
        type: "employment",
        dueDate: "2021-12-09",
        details: {
          lastAssessedOn: "2021-06-09",
          riskLevel: "MEDIUM",
        },
      },
    ],
    needs: [],
  },
  {
    stateCode: "US_ID",
    externalId: "008",
    officerId: "OFFICER6",
    tasks: [
      {
        type: "homeVisit",
        // overdue
        dueDate: "2021-12-19",
        details: {
          caseType: "GENERAL",
          lastHomeVisit: "2021-08-20",
          supervisionLevel: "MINIMUM",
          currentAddress: "100 Proplantination Drive",
        },
      },
      {
        type: "contact",
        // upcoming
        dueDate: "2022-01-12",
        details: {
          caseType: "GENERAL",
          lastContacted: "2021-11-12",
          supervisionLevel: "MINIMUM",
        },
      },
      {
        type: "assessment",
        dueDate: "2021-12-22",
        details: {
          lastAssessedOn: "2020-12-22",
          riskLevel: "MEDIUM",
        },
      },
      {
        type: "employment",
        dueDate: "2022-01-09",
        details: {
          lastAssessedOn: "2021-07-09",
          riskLevel: "MEDIUM",
        },
      },
    ],
    needs: [],
  },
];

export const usIdSupervisionTasksData: FirestoreFixture<
  SupervisionTasksRecord<"US_ID">
> = {
  data,
  idFunc: (r) => r.externalId,
};
