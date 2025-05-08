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

import { z } from "zod";

import { opportunitySchemaBase } from "~datatypes";

export const usArInstitutionalWorkerStatusSchema = opportunitySchemaBase
  .extend({
    approvedVisitors: z
      .array(
        z.object({
          checklist: z.object({
            accompliceOfResident: z.boolean(),
            authorizedToClaimProperty: z.boolean(),
            canMakeMedDecisions: z.boolean(),
            canShareDentalInfo: z.boolean(),
            canShareMedInfo: z.boolean(),
            canShareMhInfo: z.boolean(),
            emergencyNotify: z.boolean(),
            emergencyNotifyAlt: z.boolean(),
            hasCriminalHistory: z.boolean(),
            isDepCareGuardian: z.boolean(),
            livesWithResident: z.boolean(),
            victimOfResident: z.boolean(),
            worksInLe: z.boolean(),
          }),
          dateOfBirth: z.string().nullable(),
          dateOfBirthIsApproximate: z.boolean().nullable(),
          firstName: z.string().nullable(),
          lastName: z.string().nullable(),
          middleName: z.string().nullable(),
          partyId: z.string().nullable(),
          mailingAddress: z
            .object({
              apartmentNumber: z.string().nullable(),
              city: z.string().nullable(),
              poBox: z.string().nullable(),
              state: z.string().nullable(),
              streetName: z.string().nullable(),
              streetNumber: z.string().nullable(),
              streetType: z.string().nullable(),
              suiteNumber: z.string().nullable(),
              zipCode: z.string().nullable(),
            })
            .nullable(),
          physicalAddress: z
            .object({
              apartmentNumber: z.string().nullable(),
              city: z.string().nullable(),
              poBox: z.string().nullable(),
              state: z.string().nullable(),
              streetName: z.string().nullable(),
              streetNumber: z.string().nullable(),
              streetType: z.string().nullable(),
              suiteNumber: z.string().nullable(),
              zipCode: z.string().nullable(),
            })
            .nullable(),
          race: z.string().nullable(),
          relationshipComments: z.string().nullable(),
          relationshipStatus: z.string().nullable(),
          relationshipStatusDate: z.string().nullable(),
          relationshipType: z.string().nullable(),
          seqNum: z.string().nullable(),
          sex: z.string().nullable(),
          suffix: z.string().nullable(),
          visitationDurDays: z.string().nullable(),
          visitationReviewDate: z.string().nullable(),
          visitationSpecialCondition1: z.string().nullable(),
          visitationSpecialCondition2: z.string().nullable(),
          visitationStatusReason: z.string().nullable(),
        }),
      )
      .nullable(),
  })
  .passthrough();

export type UsArInstitutionalWorkerStatusReferralRecord = z.infer<
  typeof usArInstitutionalWorkerStatusSchema
>;

export type UsArInstitutionalWorkerStatusReferralRecordRaw = z.input<
  typeof usArInstitutionalWorkerStatusSchema
>;
