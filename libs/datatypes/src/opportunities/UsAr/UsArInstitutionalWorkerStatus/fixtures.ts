// Recidiviz - a data platform for criminal justice reform
// Copyright (C) 2026 Recidiviz, Inc.
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

import { makeRecordFixture } from "../../../utils/zod";
import { FixtureMapping } from "../../utils/types";
import {
  UsArInstitutionalWorkerStatusRecord,
  usArInstitutionalWorkerStatusSchema,
} from "./schema";

export const usArInstitutionalWorkerStatusFixtures = {
  fullyEligible: makeRecordFixture(usArInstitutionalWorkerStatusSchema, {
    stateCode: "US_AR",
    externalId: "RES001",
    isEligible: true,
    isAlmostEligible: false,
    eligibleCriteria: {},
    ineligibleCriteria: {},
    approvedVisitors: [],
  }),
  eligibleWithVisitors: makeRecordFixture(usArInstitutionalWorkerStatusSchema, {
    stateCode: "US_AR",
    externalId: "RES002",
    isEligible: true,
    isAlmostEligible: false,
    eligibleCriteria: {},
    ineligibleCriteria: {},
    approvedVisitors: [
      {
        firstName: "Jane",
        lastName: "Smith",
        partyId: "P001",
        dateOfBirth: "1980-03-15",
        dateOfBirthIsApproximate: false,
        relationshipType: "SPOUSE",
        race: "W",
        sex: "F",
        checklist: {
          canShareMedInfo: true,
          canShareMhInfo: true,
          canShareDentalInfo: false,
          emergencyNotify: true,
          emergencyNotifyAlt: false,
          canMakeMedDecisions: true,
          livesWithResident: false,
          victimOfResident: false,
          accompliceOfResident: false,
          hasCriminalHistory: false,
          worksInLe: false,
          isDepCareGuardian: false,
          authorizedToClaimProperty: true,
        },
        middleName: null,
        mailingAddress: {
          addressLine1: "123 Main St",
          addressLine2: null,
        },
        physicalAddress: null,
        relationshipComments: null,
        relationshipStatus: "APPROVED",
        relationshipStatusDate: "2024-01-10",
        seqNum: "1",
        suffix: null,
        visitationDurDays: null,
        visitationReviewDate: null,
        visitationSpecialCondition1: null,
        visitationSpecialCondition2: null,
        visitationStatusReason: null,
      },
    ],
  }),
} satisfies FixtureMapping<UsArInstitutionalWorkerStatusRecord>;
