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

const data: SupervisionTasksRecord<"US_NE">[] = [
  {
    stateCode: "US_NE",
    externalId: "NE001",
    officerId: "NEOFFICER1",
    tasks: [
      {
        type: "usNePersonalContact",
        dueDate: relativeFixtureDate({ days: 7 }),
        details: {
          contactCadence: "1 EVERY MONTH",
          contactCount: 3,
          contactDueDate: relativeFixtureDate({ days: 7 }),
          lastContactDate: relativeFixtureDate({ days: -21 }),
          overdueFlag: false,
          periodType: "contact",
          typeOfContact: "PERSONAL",
        },
      },
      {
        type: "usNeOrasAssessment",
        dueDate: relativeFixtureDate({ days: 14 }),
        details: {
          assessmentDueDate: relativeFixtureDate({ days: 14 }),
          mostRecentAssessmentDate: relativeFixtureDate({ months: -6 }),
          isFirstAssessment: false,
        },
      },
    ],
  },
  {
    stateCode: "US_NE",
    externalId: "NE002",
    officerId: "NEOFFICER1",
    tasks: [
      {
        type: "usNePersonalContact",
        dueDate: relativeFixtureDate({ days: -3 }),
        details: {
          contactCadence: "2 EVERY MONTH",
          contactCount: 5,
          contactDueDate: relativeFixtureDate({ days: -3 }),
          lastContactDate: relativeFixtureDate({ days: -17 }),
          overdueFlag: true,
          periodType: "contact",
          typeOfContact: "PERSONAL",
        },
      },
      {
        type: "usNeCollateralContact",
        dueDate: relativeFixtureDate({ days: 21 }),
        details: {
          contactCadence: "1 EVERY 2 MONTHS",
          contactCount: 1,
          contactDueDate: relativeFixtureDate({ days: 21 }),
          lastContactDate: relativeFixtureDate({ months: -3 }),
          overdueFlag: false,
          periodType: "contact",
          typeOfContact: "COLLATERAL",
        },
      },
      {
        type: "usNeNCJISCheckContact",
        dueDate: relativeFixtureDate({ days: 30 }),
        details: {
          contactCadence: "1 EVERY MONTH",
          contactCount: 2,
          contactDueDate: relativeFixtureDate({ days: 30 }),
          lastContactDate: relativeFixtureDate({ days: -30 }),
          overdueFlag: false,
          periodType: "contact",
          typeOfContact: "NCJIS",
        },
      },
    ],
  },
  {
    stateCode: "US_NE",
    externalId: "NE003",
    officerId: "NEOFFICER1",
    tasks: [
      {
        type: "usNePersonalContact",
        dueDate: relativeFixtureDate({ days: 2 }),
        details: {
          contactCadence: "1 EVERY MONTH",
          contactCount: 8,
          contactDueDate: relativeFixtureDate({ days: 2 }),
          lastContactDate: relativeFixtureDate({ days: -5 }),
          overdueFlag: false,
          periodType: "contact",
          typeOfContact: "PERSONAL",
        },
      },
    ],
  },
  {
    stateCode: "US_NE",
    externalId: "NE004",
    officerId: "NEOFFICER1",
    tasks: [
      {
        type: "usNePersonalContact",
        dueDate: relativeFixtureDate({ days: -5 }),
        details: {
          contactCadence: "1 EVERY 2 MONTHS",
          contactCount: 4,
          contactDueDate: relativeFixtureDate({ days: -5 }),
          lastContactDate: relativeFixtureDate({ days: -19 }),
          overdueFlag: true,
          periodType: "contact",
          typeOfContact: "PERSONAL",
        },
      },
      {
        type: "usNeStableAssessment",
        dueDate: relativeFixtureDate({ days: 45 }),
        details: {
          assessmentDueDate: relativeFixtureDate({ days: 45 }),
          mostRecentAssessmentDate: relativeFixtureDate({ months: -4 }),
          isFirstAssessment: false,
        },
      },
      {
        type: "usNeCollateralContact",
        dueDate: relativeFixtureDate({ days: 10 }),
        details: {
          contactCadence: "1 EVERY MONTH",
          contactCount: 2,
          contactDueDate: relativeFixtureDate({ days: 10 }),
          lastContactDate: relativeFixtureDate({ days: -20 }),
          overdueFlag: false,
          periodType: "contact",
          typeOfContact: "COLLATERAL",
        },
      },
    ],
  },
  {
    stateCode: "US_NE",
    externalId: "NE005",
    officerId: "NEOFFICER1",
    tasks: [
      {
        type: "usNePersonalContact",
        dueDate: relativeFixtureDate({ days: 12 }),
        details: {
          contactCadence: "1 EVERY MONTH",
          contactCount: 2,
          contactDueDate: relativeFixtureDate({ days: 12 }),
          lastContactDate: relativeFixtureDate({ days: -18 }),
          overdueFlag: false,
          periodType: "contact",
          typeOfContact: "PERSONAL",
        },
      },
      {
        type: "usNeNCJISCheckContact",
        dueDate: relativeFixtureDate({ days: 60 }),
        details: {
          contactCadence: "1 EVERY MONTH",
          contactCount: 1,
          contactDueDate: relativeFixtureDate({ days: 60 }),
          lastContactDate: null,
          overdueFlag: false,
          periodType: "contact",
          typeOfContact: "NCJIS",
        },
      },
    ],
  },
];

export const usNeSupervisionTasksData: FirestoreFixture<
  SupervisionTasksRecord<"US_NE">
> = {
  data,
  idFunc: (r) => r.externalId,
};
