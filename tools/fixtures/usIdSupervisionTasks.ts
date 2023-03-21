// Recidiviz - a data platform for criminal justice reform
// Copyright (C) 2022 Recidiviz, Inc.
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
import { addDays, endOfToday, formatISO, subDays } from "date-fns";

import { SupervisionTasksRecord } from "../../src/WorkflowsStore/Task/types";
import { FixtureData } from "../workflowsFixtures";

const data: SupervisionTasksRecord[] = [
  {
    stateCode: "US_ID",
    externalId: "008",
    officerId: "OFFICER6",
    tasks: [
      {
        type: "homeVisit",
        // overdue
        dueDate: formatISO(subDays(endOfToday(), 2)),
        details: {
          supervisionLevel: "LOW",
          currentAddress: "100 Proplantination Drive",
        },
      },
      {
        type: "contact",
        // upcoming
        dueDate: formatISO(addDays(endOfToday(), 15)),
        details: {
          supervisionLevel: "LOW",
        },
      },
    ],
    needs: [{ type: "employment" }],
  },
];

export const usIdSupervisionTasksData: FixtureData<SupervisionTasksRecord> = {
  data,
  idFunc: (r) => r.externalId,
};
