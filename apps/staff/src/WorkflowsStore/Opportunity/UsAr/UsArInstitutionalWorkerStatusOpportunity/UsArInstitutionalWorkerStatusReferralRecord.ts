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
  middleName: nullishAsUndefined(z.string()),
  mailingAddress: z
    .object({
      addressLine1: nullishAsUndefined(z.string()).optional(),
      addressLine2: nullishAsUndefined(z.string()).optional(),
    })
    .nullable(),
  physicalAddress: z
    .object({
      addressLine1: nullishAsUndefined(z.string()).optional(),
      addressLine2: nullishAsUndefined(z.string()).optional(),
    })
    .nullable(),
  relationshipComments: nullishAsUndefined(z.string()),
  relationshipStatus: nullishAsUndefined(z.string()),
  relationshipStatusDate: nullishAsUndefined(z.string()),
  seqNum: nullishAsUndefined(z.string()),
  suffix: nullishAsUndefined(z.string()),
  visitationDurDays: nullishAsUndefined(z.string()),
  visitationReviewDate: nullishAsUndefined(z.string()),
  visitationSpecialCondition1: nullishAsUndefined(z.string()),
  visitationSpecialCondition2: nullishAsUndefined(z.string()),
  visitationStatusReason: nullishAsUndefined(z.string()),
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
