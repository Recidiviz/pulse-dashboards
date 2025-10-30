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

import { startOfToday } from "date-fns";
import { z } from "zod";

import { isTestEnv } from "~client-env-utils";
import { dateStringSchema, opportunitySchemaBase } from "~datatypes";

import { nullishAsUndefined, stringToIntSchema } from "../../schemaHelpers";

export const usNdEarlyTerminationSchema = opportunitySchemaBase.extend({
  formInformation: z
    .object({
      clientName: z.string(),
      convictionCounty: z.string(),
      judicialDistrictCode: z.string(),
      criminalNumber: z.string(),
      judgeName: z.string(),
      priorCourtDate: dateStringSchema,
      sentenceLengthMonths: stringToIntSchema,
      crimeNames: z.array(z.string()),
      probationStartDate: dateStringSchema,
      probationOfficerFullName: z.string(),
      statesAttorneyPhoneNumber: z.string(),
      statesAttorneyEmailAddress: z.string(),
      statesAttorneyMailingAddress: z.string(),
      statesAttorneyName: z.string(),
    })
    .partial()
    .extend({
      probationExpirationDate: dateStringSchema.refine((val) => {
        // Valid probation expiration dates must be in the future
        return isTestEnv() || val > startOfToday();
      }),
    }),
  eligibleCriteria: z
    .object({
      supervisionPastEarlyDischargeDate: z
        .object({
          eligibleDate: dateStringSchema.optional(),
        })
        .optional(),
      usNdImpliedValidEarlyTerminationSupervisionLevel: z
        .object({
          supervisionLevel: z.string(),
        })
        .optional(),
      usNdImpliedValidEarlyTerminationSentenceType: z
        .object({
          supervisionType: z.string(),
        })
        .optional(),
      usNdNotInActiveRevocationStatus: z
        .object({
          revocationDate: z.null(),
        })
        .optional(),
    })
    .passthrough(),
  ineligibleCriteria: z
    .object({
      supervisionPastEarlyDischargeDate: nullishAsUndefined(
        z.object({
          eligibleDate: dateStringSchema.nullish(),
        }),
      ),
    })
    .passthrough(),
  metadata: z.object({
    multipleSentences: z.boolean(),
    outOfState: z.boolean(),
    ICOut: z.boolean(),
  }),
});

export type UsNdEarlyTerminationReferralRecord = z.infer<
  typeof usNdEarlyTerminationSchema
>;
export type UsNdEarlyTerminationReferralRecordRaw = z.input<
  typeof usNdEarlyTerminationSchema
>;

export type UsNdEarlyTerminationDraftData = {
  courtName: string;
  clientName: string;
  convictionCounty: string;
  plaintiff: string;
  finesAndFees: string;
  judicialDistrictCode: string;
  criminalNumber: string;
  judgeName: string;
  priorCourtDate: string;
  sentenceLengthMonths: string;
  crimeNames: string;
  probationStartDate: string;
  probationExpirationDate: string;
  probationOfficerFullName: string;
  statesAttorneyNumber: string;
  statesAttorneyPhoneNumber: string;
  statesAttorneyEmailAddress: string;
  statesAttorneyMailingAddress: string;
  statesAttorneyName: string;
  priorCourtDay: string;
  priorCourtMonth: string;
  priorCourtYear: string;
  // Extendable to facilitate `additionalDepositionLines` dynamic keys
  [k: string]: string;
};
