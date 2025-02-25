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

import { makeRecordFixture } from "../../../utils/zod/object/makeRecordFixture";
import { FixtureMapping } from "../../utils/types";
import {
  UsMeAnnualReclassificationRecord,
  usMeAnnualReclassificationSchema,
} from "./schema";

export const usMeAnnualReclassificationFixtures = {
  fullyEligible: makeRecordFixture(usMeAnnualReclassificationSchema, {
    stateCode: "US_ME",
    externalId: "RES001",
    eligibleCriteria: {
      usMeIncarcerationPastRelevantClassificationDate: {
        latestClassificationDate: null,
        reclassType: "ANNUAL",
      },
    },
    formInformation: {
      arrivalDate: "2014-10-07",
      casePlanGoals:
        "Education / Employment - In Progress - Other - I want to pursue further education. @@@ Accommodations - In Progress - Other - I want to maintain my current housing. @@@ Education / Employment - In Progress - Other - I want to maintain my current employment at the company. @@@ Leisure / Recreation - In Progress - Other - I want to continue to improve my community by contributing to its development.",
      currentOffenses: "MURDER (M) {99999}",
      programEnrollment:
        "Completed Successfully - edu College- Bachelor's Degree - AA Liberal Studies, UMA - 2022-01-06",
      furloughs: "2024-01-13, 2023-11-08",
      workAssignments: "Argo Labs, Lab Technician; 2023-10-03: Present",
    },
    ineligibleCriteria: {},
    isEligible: true,
    isAlmostEligible: false,
    metadata: {},
  }),
  almostEligible: makeRecordFixture(usMeAnnualReclassificationSchema, {
    stateCode: "US_ME",
    externalId: "RES002",
    eligibleCriteria: {},
    ineligibleCriteria: {
      usMeIncarcerationPastRelevantClassificationDate: {
        latestClassificationDate: null,
        reclassType: "SEMIANNUAL",
      },
    },
    formInformation: {
      arrivalDate: "2012-11-03",
      casePlanGoals:
        "Education / Employment - In Progress - Other - I want to pursue further education. @@@ Accommodations - In Progress - Other - I want to maintain my current housing. @@@ Education / Employment - In Progress - Other - I want to maintain my current employment at the company. @@@ Leisure / Recreation - In Progress - Other - I want to continue to improve my community by contributing to its development.",
      currentOffenses: "LARCENY (M) {99999}",
      programEnrollment:
        "Completed Successfully - edu College- Bachelor's Degree - AA Liberal Studies, UMA - 2022-01-06",
      furloughs: "2024-01-13, 2023-11-08",
      workAssignments: "Argo Labs, Lab Technician; 2023-10-03: Present",
    },
    isEligible: false,
    isAlmostEligible: true,
    metadata: {},
  }),
} satisfies FixtureMapping<UsMeAnnualReclassificationRecord>;
