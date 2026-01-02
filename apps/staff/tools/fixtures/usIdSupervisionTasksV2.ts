// Recidiviz - a data platform for criminal justice reform
// Copyright (C) 2025 Recidiviz, Inc.
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

import { relativeFixtureDate } from "~datatypes";

import { SupervisionTasksRecord } from "../../src/WorkflowsStore/Task/types";
import { FirestoreFixture } from "./utils";

const data: SupervisionTasksRecord<"US_ID">[] = [
  {
    stateCode: "US_ID",
    externalId: "004",
    officerId: "OFFICER6",
    tasks: [
      {
        type: "usIdHomeVisit",
        dueDate: relativeFixtureDate({ days: -10 }),
        details: {
          contactCadence: "1 EVERY 365",
          lastContactDate: relativeFixtureDate({ days: -10 - 390 }),
        },
      },
      {
        type: "usIdEmploymentVerification",
        dueDate: relativeFixtureDate({ days: 20 }),
        details: {
          contactCadence: "1 EVERY 180",
          lastContactDate: relativeFixtureDate({ days: 20 - 180 }),
        },
      },
      {
        type: "usIdFaceToFaceContact",
        dueDate: relativeFixtureDate({ days: 3 }),
        details: {
          contactCadence: "1 EVERY 180",
          lastContactDate: relativeFixtureDate({ days: 3 - 180 }),
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
        type: "usIdHomeVisit",
        dueDate: relativeFixtureDate({ days: -10 }),
        details: {
          contactCadence: "1 EVERY 365",
          lastContactDate: relativeFixtureDate({ days: -10 - 390 }),
        },
      },
      {
        type: "usIdLsirAssessment",
        dueDate: relativeFixtureDate({ days: 365 }),
        details: {
          contactCadence: "1 EVERY 365",
          lastContactDate: relativeFixtureDate({ days: -1 }),
        },
      },
      {
        type: "usIdEmploymentVerification",
        dueDate: relativeFixtureDate({ days: 20 }),
        details: {
          contactCadence: "1 EVERY 180",
          lastContactDate: relativeFixtureDate({ days: 20 - 180 }),
        },
      },
      {
        type: "usIdFaceToFaceContact",
        dueDate: relativeFixtureDate({ days: 20 }),
        details: {
          contactCadence: "1 EVERY 180",
          lastContactDate: relativeFixtureDate({ days: 20 - 180 }),
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
        type: "usIdLsirAssessment",
        dueDate: relativeFixtureDate({ days: 365 }),
        details: {
          contactCadence: "1 EVERY 365",
          lastContactDate: relativeFixtureDate({ days: -1 }),
        },
      },
      {
        type: "usIdHomeVisit",
        dueDate: relativeFixtureDate({ days: 0 }),
        details: {
          contactCadence: "1 EVERY 365",
          lastContactDate: relativeFixtureDate({ days: -10 - 390 }),
        },
      },
      {
        type: "usIdEmploymentVerification",
        dueDate: relativeFixtureDate({ days: 20 }),
        details: {
          contactCadence: "1 EVERY 180",
          lastContactDate: relativeFixtureDate({ days: 20 - 180 }),
        },
      },
      {
        type: "usIdFaceToFaceContact",
        dueDate: relativeFixtureDate({ days: 20 }),
        details: {
          contactCadence: "1 EVERY 180",
          lastContactDate: relativeFixtureDate({ days: 20 - 180 }),
        },
      },
    ],
    needs: [],
  },
];

export const usIdSupervisionTasksV2Data: FirestoreFixture<
  SupervisionTasksRecord<"US_ID">
> = {
  data,
  idFunc: (r) => r.externalId,
};
