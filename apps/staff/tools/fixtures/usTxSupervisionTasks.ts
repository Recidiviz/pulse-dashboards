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
        type: "usTxHomeVisit",
        // overdue
        dueDate: "2022-01-03",
        details: {
          contactCount: 2,
          lastContactDate: "2021-08-03",
          overdueFlag: false,
          typeOfContact: "HOME",
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
        type: "usTxHomeVisit",
        // overdue
        dueDate: "2022-03-09",
        details: {
          contactCount: 2,
          lastContactDate: "2021-03-09",
          overdueFlag: false,
          typeOfContact: "HOME",
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
