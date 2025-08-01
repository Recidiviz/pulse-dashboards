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

import { z } from "zod";

import { dateStringSchema, opportunitySchemaBase } from "~datatypes";

import { OpportunityValidationError } from "../../../../errors";
import { Client } from "../../..";
import { ValidateFunction } from "../../../subscriptions";
import { NullCoalesce } from "../../schemaHelpers";

const contactSchema = z.object({
  contactDate: dateStringSchema,
  contactType: z.string(),
  contactComment: z.string().optional(),
});

export const usTnExpirationSchema = opportunitySchemaBase.extend({
  formInformation: z.object({
    latestPse: contactSchema.optional(),
    latestEmp: contactSchema.optional(),
    latestSpe: contactSchema.optional(),
    latestVrr: contactSchema.optional(),
    latestFee: contactSchema.optional(),
    newOffenses: z.array(contactSchema),
    alcoholHistory: z.array(contactSchema),
    sexOffenses: z.array(z.string()),
    offenses: z.array(z.string()),
    docketNumbers: z.array(z.string()),
    convictionCounties: z.array(z.string()),
    gangAffiliationId: z.string().optional(),
  }),
  eligibleCriteria: z
    .object({
      supervisionPastFullTermCompletionDate: z.object({
        eligibleDate: dateStringSchema,
      }),
      usTnNoZeroToleranceCodesSpans: NullCoalesce(
        { zeroToleranceCodeDates: undefined },
        z
          .object({
            zeroToleranceCodeDates: z.array(dateStringSchema).nullish(),
          })
          .optional(),
      ),
      usTnNotOnLifeSentenceOrLifetimeSupervision: NullCoalesce(
        {},
        z.object({
          lifetimeFlag: z.boolean().optional(),
        }),
      ),
    })
    .passthrough(),
});

export type UsTnExpirationReferralRecord = z.infer<typeof usTnExpirationSchema>;
export type UsTnExpirationReferralRecordRaw = z.input<
  typeof usTnExpirationSchema
>;

export type Contact = {
  contactDate: Date;
  contactType: string;
  contactComment?: string;
};

export type UsTnExpirationDraftData = {
  contactTypes: string;
  expirationDate: string;
  currentOffenses: string;
  convictionCounties: string;
  docketNumbers: string;
  sexOffenseInformation: string;
  alcoholDrugInformation: string;
  address: string;
  employmentInformation: string;
  feeHistory: string;
  specialConditions: string;
  revocationHearings: string;
  newOffenses: string;
  historyOfPriorViolenceEtc: string;
  transferHistory: string;
  medicalPsychologicalHistory: string;
  gangAffiliation: string;
  victimInformation: string;
  votersRightsInformation: string;
  additionalNotes: string;
};

export function getUsTnExpirationValidator(
  client: Client,
): ValidateFunction<UsTnExpirationReferralRecord> {
  return (transformedRecord) => {
    // we only want to validate the eligibility date for elibible/almost eligible records
    // as ineligible (never eligible) clients do not have records
    if (transformedRecord.isEligible || transformedRecord.isAlmostEligible) {
      const { eligibleDate } =
        transformedRecord.eligibleCriteria
          .supervisionPastFullTermCompletionDate;

      if (eligibleDate.getTime() !== client.expirationDate?.getTime())
        throw new OpportunityValidationError(
          "Expiration date does not match client record",
        );
    }
  };
}
