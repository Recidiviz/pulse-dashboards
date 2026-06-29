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

import { z } from "zod";

import { ParsedRecord } from "../../../utils/types";
import { dateStringSchema, nullishAsUndefined } from "../../../utils/zod";
import { opportunitySchemaBase } from "../../utils/opportunitySchemaBase";

export const usNdEarlyTerminationSchema = opportunitySchemaBase.extend({
  formInformation: z
    .object({
      clientName: z.string(),
      convictionCounty: z.string(),
      judicialDistrictCode: z.string(),
      criminalNumber: z.string(),
      judgeName: z.string(),
      priorCourtDate: dateStringSchema,
      sentenceLengthMonths: z.string().transform((s) => parseInt(s)),
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
      probationExpirationDate: dateStringSchema,
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

export type UsNdEarlyTerminationReferralRecord = ParsedRecord<
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
