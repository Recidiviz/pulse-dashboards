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

import { dateStringSchema, opportunitySchemaBase } from "~datatypes";

import { stringToIntSchema } from "../../schemaHelpers";

export const usTnCompliantReporting2025PolicySchema =
  opportunitySchemaBase.extend({
    formInformation: z
      .object({
        sentenceStartDate: dateStringSchema,
        expirationDate: dateStringSchema,
        sentenceLengthDays: stringToIntSchema,
        currentOffenses: z.array(z.string()),
        driversLicense: z.string(),
        restitutionAmt: z.number(),
        restitutionMonthlyPayment: z.number(),
        restitutionMonthlyPaymentTo: z.array(z.string()),
        courtCostsPaid: z.boolean(),
        supervisionFeeAssessed: z.number(),
        supervisionFeeArrearaged: z.boolean(),
        supervisionFeeArrearagedAmount: z.number(),
        currentExemptionsAndExpiration: z.array(
          z.object({
            exemptionReason: z.string(),
            endDate: dateStringSchema.nullish(),
          }),
        ),
        supervisionFeeWaived: z.boolean(),
        docketNumbers: z.array(z.string()),
        judicialDistrict: z.array(z.string()),
      })
      .partial(),
    metadata: z
      .object({
        tabName: z.string().optional(),
        convictionCounties: z.array(z.string()),
        eligibleDate: dateStringSchema,
      })
      .passthrough(),
  });

export type UsTnCompliantReporting2025PolicyReferralRecord = z.infer<
  typeof usTnCompliantReporting2025PolicySchema
>;

export type UsTnCompliantReporting2025PolicyReferralRecordRaw = z.input<
  typeof usTnCompliantReporting2025PolicySchema
>;
