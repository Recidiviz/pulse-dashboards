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

import { zipWith } from "lodash-es";
import { z } from "zod";

import { ParsedRecord } from "../../../utils/types";
import { dateStringSchema, stringToIntSchema } from "../../../utils/zod";
import { opportunitySchemaBase } from "../../utils/opportunitySchemaBase";

const SpecialConditionsNoteType = ["SPEC", "SPET"] as const;

const zipIneligibleOffenseAndDates = (
  ineligibleOffenses: string[],
  relevantDates: Date[],
) =>
  zipWith(ineligibleOffenses, relevantDates, (offense, date) => ({
    ineligibleOffense: offense,
    relevantDate: date,
  }));

export const compliantReportingSchema = opportunitySchemaBase.extend({
  eligibleCriteria: z
    .object({
      usTnOnEligibleLevelForSufficientTime: z
        .object({
          eligibleDate: dateStringSchema,
          eligibleLevel: z.string(),
          startDateOnEligibleLevel: dateStringSchema,
        })
        .optional(),
      hasFinesFeesBalanceBelow500OrHasPayments3ConsecutiveMonthsOrIsExempt: z
        .object({
          amountOwed: z.number(),
          consecutiveMonthlyPayments: z.number().nullable(),
          currentExemptions: z.array(z.string()).optional(),
        })
        .optional(),
      // Transform null fields to empty object to make them easier to use in conditionals later
      usTnNoArrestsInPastYear: z.null().transform(() => ({})),
      usTnNegativeArrestCheckInPastYear: z
        .object({
          latestNegativeArrestCheckDate: dateStringSchema.nullable(),
        })
        .optional(),
      usTnNoHighSanctionsInPastYear: z
        .null()
        .transform(() => ({}))
        .optional(),
      usTnNoRecentCompliantReportingRejections: z
        .null()
        .transform(() => ({}))
        .optional(),
      usTnSpecialConditionsAreCurrent: z.object({
        speNoteDue: dateStringSchema.nullable(),
      }),
      usTnNotServingIneligibleCrOffense: z.null().transform(() => ({})),
      usTnPassedDrugScreenCheck: z.object({
        alcDrugNeedLevel: z.string().optional(),
        negativeDrugScreenHistoryArray: z.array(
          z.object({
            negativeScreenDate: dateStringSchema,
            negativeScreenResult: z.string(),
          }),
        ),
        mostRecentPositiveTestDate: dateStringSchema.nullish(),
        latestDrugScreenResult: z.string(),
        latestDrugScreenDate: dateStringSchema,
      }),
      usTnNoZeroToleranceCodesSpans: z
        .object({
          zeroToleranceCodeDates: z.array(dateStringSchema).nullable(),
        })
        .nullable(),
      usTnIneligibleOffensesExpired: z
        .object({
          ineligibleOffenses: z.array(z.string()),
          ineligibleSentencesExpirationDates: z.array(dateStringSchema),
        })
        .transform((val) =>
          zipIneligibleOffenseAndDates(
            val.ineligibleOffenses,
            val.ineligibleSentencesExpirationDates,
          ),
        )
        .nullish(),
      usTnNotServingUnknownCrOffense: z
        .object({
          ineligibleOffenses: z.array(z.string()),
          ineligibleSentencesExpirationDate: z.array(dateStringSchema),
        })
        .transform((val) =>
          zipIneligibleOffenseAndDates(
            val.ineligibleOffenses,
            val.ineligibleSentencesExpirationDate,
          ),
        )
        .nullish(),
      usTnNoPriorRecordWithIneligibleCrOffense: z
        .object({
          ineligibleOffenses: z.array(z.string()),
          ineligibleOffenseDates: z.array(dateStringSchema),
        })
        .transform((val) =>
          zipIneligibleOffenseAndDates(
            val.ineligibleOffenses,
            val.ineligibleOffenseDates,
          ),
        )
        .nullish(),
      hasActiveSentence: z
        .object({
          hasActiveSentence: z.boolean(),
        })
        .nullable()
        .transform((val) => val ?? { hasActiveSentence: false }),
    })
    .passthrough(),
  ineligibleCriteria: z
    .object({
      usTnOnEligibleLevelForSufficientTime: z
        .object({
          eligibleDate: dateStringSchema,
          eligibleLevel: z.string(),
          startDateOnEligibleLevel: dateStringSchema,
        })
        .optional(),
      hasFinesFeesBalanceBelow500OrHasPayments3ConsecutiveMonthsOrIsExempt: z
        .object({
          amountOwed: z.number(),
          consecutiveMonthlyPayments: z.number().nullable(),
        })
        .optional(),
      usTnNoHighSanctionsInPastYear: z
        .object({
          latestHighSanctionDate: dateStringSchema,
        })
        .optional(),
      usTnNoRecentCompliantReportingRejections: z
        .object({
          contactCode: z.array(z.string()),
        })
        .optional(),
      usTnNegativeArrestCheckInPastYear: z
        .object({
          latestNegativeArrestCheckDate: dateStringSchema.nullable(),
        })
        .optional(),
    })
    .passthrough(),
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
  metadata: z.object({
    latestNegativeArrestCheck: z.object({
      contactDate: dateStringSchema,
      contactType: z.literal("ARRN"),
    }),
    mostRecentSpeNote: z
      .object({
        contactDate: dateStringSchema,
        contactType: z.enum(SpecialConditionsNoteType),
      })
      .optional(), // in theory someone could have no special conditions so marking as optional (in practice this is always set)
    // this should really be in formInformation, but was put into metadata accidentally and it's
    // not really worth fixing at this point
    convictionCounties: z.array(z.string()),
    ineligibleOffensesExpired: z.array(z.string()),
  }),
});

export type CompliantReportingRecord = ParsedRecord<
  typeof compliantReportingSchema
>;
