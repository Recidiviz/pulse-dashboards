// Recidiviz - a data platform for criminal justice reform
// Copyright (C) 2022 Recidiviz, Inc.
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

import { zipWith } from "lodash";
import { z } from "zod";

import { dateStringSchema, opportunitySchemaBase } from "~datatypes";

import { stringToIntSchema } from "../../schemaHelpers";

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
  eligibleCriteria: z.object({
    usTnOnEligibleLevelForSufficientTime: z
      .object({
        eligibleDate: dateStringSchema,
        eligibleLevel: z.string(),
        startDateOnEligibleLevel: dateStringSchema,
      })
      .optional(),
    usTnFinesFeesEligible: z
      .object({
        hasFinesFeesBalanceBelow500: z.object({
          amountOwed: z.number(),
        }),
        hasPayments3ConsecutiveMonths: z.object({
          amountOwed: z.number(),
          consecutiveMonthlyPayments: z.number().nullable(),
        }),
        hasPermanentFinesFeesExemption: z
          .object({
            currentExemptions: z.array(z.string()),
          })
          .optional(),
      })
      .optional(),
    // Transform null fields to empty object to make them easier to use in conditionals later
    usTnNoArrestsInPastYear: z.null().transform((_val) => ({})),
    usTnNoHighSanctionsInPastYear: z
      .null()
      .transform((_val) => ({}))
      .optional(),
    usTnNoRecentCompliantReportingRejections: z
      .null()
      .transform((_val) => ({}))
      .optional(),
    usTnSpecialConditionsAreCurrent: z.object({
      speNoteDue: dateStringSchema.nullable(),
    }),
    usTnNotServingIneligibleCrOffense: z.null().transform((_val) => ({})),
    usTnPassedDrugScreenCheck: z.object({
      hasAtLeast1NegativeDrugTestPastYear: z.array(
        z.object({
          negativeScreenDate: dateStringSchema,
          negativeScreenResult: z.string(),
        }),
      ),
      latestDrugTestIsNegative: z.object({
        latestDrugScreenDate: dateStringSchema,
        latestDrugScreenResult: z.string(),
      }),
      // omitting hasAtLeast2NegativeDrugTestsPastYear because if they have at least 2, they have at least 1
      // omitting latestAlcoholDrugNeedLevel because it is not used in any copy
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
  }),
  ineligibleCriteria: z.object({
    usTnOnEligibleLevelForSufficientTime: z
      .object({
        eligibleDate: dateStringSchema,
        eligibleLevel: z.string(),
        startDateOnEligibleLevel: dateStringSchema,
      })
      .optional(),
    usTnFinesFeesEligible: z
      .object({
        hasFinesFeesBalanceBelow500: z.object({
          amountOwed: z.number(),
        }),
        hasPayments3ConsecutiveMonths: z.object({
          amountOwed: z.number(),
          consecutiveMonthlyPayments: z.number().nullable(),
        }),
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
  }),
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
    mostRecentArrestCheck: z.object({
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

export type CompliantReportingReferralRecord = z.infer<
  typeof compliantReportingSchema
>;
export type CompliantReportingReferralRecordRaw = z.input<
  typeof compliantReportingSchema
>;

export type CompliantReportingTransformedETLFormInput = {
  // From opportunity record
  sentenceStartDate: string;
  expirationDate: string;
  sentenceLengthDaysText: string;
  currentOffenses0: string;
  currentOffenses1: string;
  currentOffenses2: string;
  currentOffenses3: string;
  currentOffenses4: string;
  driversLicense: string;
  restitutionAmt: string;
  restitutionMonthlyPayment: string;
  restitutionMonthlyPaymentTo: string;
  courtCostsPaid: boolean;
  supervisionFeeAssessed: string;
  supervisionFeeArrearaged: boolean;
  supervisionFeeArrearagedAmount: string;
  supervisionFeeExemptionExpirDate: string;
  supervisionFeeExemptionType: string;
  supervisionFeeWaived: string;
  docketNumbers: string;
  judicialDistrict: string;
  tdocId: string;
  specialConditionsAlcDrugScreenDate: string;
  convictionCounty: string;

  // From client record
  clientFullName: string;
  telephoneNumber: string;
  isParole: boolean;
  isProbation: boolean;
  isIsc: boolean;
  is4035313: boolean;
  poFullName: string;
  physicalAddress: string;

  // Other
  dateToday: string;
  courtName: string;
};

export type CompliantReportingDraftData =
  CompliantReportingTransformedETLFormInput & {
    /* Fields in the UI that are not included in the ETL */
    atrSupervisionTransfer: boolean;
    courtCostsBalance: string;
    courtCostsMonthlyAmt1: string;
    currentEmployer: string;
    driversLicenseRevoked: string;
    driversLicenseSuspended: string;
    iotSanctioning: boolean;
    licenseYears: string;
    seeAdditionalOffenses: boolean;
    specialConditionsAlcDrugScreen: boolean;
    specialConditionsAlcDrugAssessment: string;
    specialConditionsAlcDrugAssessmentComplete: boolean;
    specialConditionsAlcDrugAssessmentCompleteDate: string;
    specialConditionsAlcDrugAssessmentPending: boolean;
    specialConditionsAlcDrugTreatment: boolean;
    specialConditionsAlcDrugTreatmentComplete: boolean;
    specialConditionsAlcDrugTreatmentCompleteDate: string;
    specialConditionsAlcDrugTreatmentCurrent: boolean;
    specialConditionsAlcDrugTreatmentIsInpatient: boolean;
    specialConditionsAlcDrugTreatmentIsOutpatient: boolean;
    specialConditionsCommunityService: boolean;
    specialConditionsCommunityServiceCompletionDate: string;
    specialConditionsCommunityServiceCurrent: boolean;
    specialConditionsCommunityServiceHours: string;
    specialConditionsCounseling: boolean;
    specialConditionsCounselingAngerManagement: boolean;
    specialConditionsCounselingAngerManagementComplete: boolean;
    specialConditionsCounselingAngerManagementCompleteDate: string;
    specialConditionsCounselingAngerManagementCurrent: boolean;
    specialConditionsCounselingMentalHealth: boolean;
    specialConditionsCounselingMentalHealthComplete: boolean;
    specialConditionsCounselingMentalHealthCompleteDate: string;
    specialConditionsCounselingMentalHealthCurrent: boolean;
    specialConditionsProgramming: boolean;
    specialConditionsProgrammingCognitiveBehavior: boolean;
    specialConditionsProgrammingCognitiveBehaviorCompletionDate: string;
    specialConditionsProgrammingCognitiveBehaviorCurrent: boolean;
    specialConditionsProgrammingFsw: boolean;
    specialConditionsProgrammingFswCompletionDate: string;
    specialConditionsProgrammingFswCurrent: boolean;
    specialConditionsProgrammingSafe: boolean;
    specialConditionsProgrammingSafeCompletionDate: string;
    specialConditionsProgrammingSafeCurrent: boolean;
    specialConditionsProgrammingVictimImpact: boolean;
    specialConditionsProgrammingVictimImpactCompletionDate: string;
    specialConditionsProgrammingVictimImpactCurrent: boolean;
    specialConditionsNoContact: boolean;
    specialConditionsNoContactName: string;
    specialConditionsCommunityServiceComplete: boolean;
    specialConditionsProgrammingCognitiveBehaviorComplete: boolean;
    specialConditionsProgrammingSafeComplete: boolean;
    specialConditionsProgrammingVictimImpactComplete: boolean;
    specialConditionsProgrammingFswComplete: boolean;
    supervisorFullName: string;
  };
