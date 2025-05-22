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

import { nullishAsUndefined } from "../../schemaHelpers";

const usArApprovedVisitorSchema = z.object({
  firstName: nullishAsUndefined(z.string()),
  lastName: nullishAsUndefined(z.string()),
  partyId: nullishAsUndefined(z.string()),
  dateOfBirth: nullishAsUndefined(z.string()),
  dateOfBirthIsApproximate: nullishAsUndefined(z.boolean()),
  relationshipType: nullishAsUndefined(z.string()),
  race: nullishAsUndefined(z.string()),
  sex: nullishAsUndefined(z.string()),
  checklist: z.object({
    canShareMedInfo: z.boolean(),
    canShareMhInfo: z.boolean(),
    canShareDentalInfo: z.boolean(),
    emergencyNotify: z.boolean(),
    emergencyNotifyAlt: z.boolean(),
    canMakeMedDecisions: z.boolean(),
    livesWithResident: z.boolean(),
    victimOfResident: z.boolean(),
    accompliceOfResident: z.boolean(),
    hasCriminalHistory: z.boolean(),
    worksInLe: z.boolean(),
    isDepCareGuardian: z.boolean(),
    authorizedToClaimProperty: z.boolean(),
  }),
  middleName: z.string().nullable(),
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
      addressLine1: nullishAsUndefined(z.string()).optional(),
      addressLine2: nullishAsUndefined(z.string()).optional(),
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
      addressLine1: nullishAsUndefined(z.string()).optional(),
      addressLine2: nullishAsUndefined(z.string()).optional(),
    })
    .nullable(),
  relationshipComments: nullishAsUndefined(z.string()),
  relationshipStatus: z.string().nullable(),
  relationshipStatusDate: z.string().nullable(),
  seqNum: z.string().nullable(),
  suffix: z.string().nullable(),
  visitationDurDays: z.string().nullable(),
  visitationReviewDate: z.string().nullable(),
  visitationSpecialCondition1: z.string().nullable(),
  visitationSpecialCondition2: z.string().nullable(),
  visitationStatusReason: z.string().nullable(),
});

export const usArInstitutionalWorkerStatusSchema = opportunitySchemaBase
  .extend({
    approvedVisitors: z.array(usArApprovedVisitorSchema),
  })
  .passthrough();

export type UsArInstitutionalWorkerStatusReferralRecord = z.infer<
  typeof usArInstitutionalWorkerStatusSchema
>;

export type UsArInstitutionalWorkerStatusReferralRecordRaw = z.input<
  typeof usArInstitutionalWorkerStatusSchema
>;

export type UsArApprovedVisitor = z.infer<typeof usArApprovedVisitorSchema>;
export type UsArApprovedVisitorWithChecklist = Partial<UsArApprovedVisitor> &
  Pick<UsArApprovedVisitor, "checklist">;

export type UsArInstitutionalWorkerStatusDraftData = {
  visitors: UsArApprovedVisitorWithChecklist[];
};
