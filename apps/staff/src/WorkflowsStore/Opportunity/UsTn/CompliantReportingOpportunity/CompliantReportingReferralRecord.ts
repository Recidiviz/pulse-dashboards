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

import { sub } from "date-fns";
import { DocumentData, Timestamp } from "firebase/firestore";
import { z } from "zod";

import { formatDateToISO } from "../../../../utils/formatStrings";
import { TransformFunction } from "../../../subscriptions";
import { fieldToDate } from "../../../utils";
import { dateStringSchema, opportunitySchemaBase } from "../../schemaHelpers";

const SpecialConditionsNoteType = ["SPEC", "SPET"] as const;

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
        })
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
      sentenceLengthDays: z.coerce.number().int(),
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
        })
      ),
      supervisionFeeWaived: z.boolean(),
      docketNumbers: z.array(z.string()),
      judicialDistrict: z.array(z.string()),
    })
    .partial(),
  metadata: z
    .object({
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
    })
    .passthrough(), // temporary passthrough to allow fixture data with metadata fields we haven't accounted for yet
});

export type CompliantReportingReferralRecordFull = z.infer<
  typeof compliantReportingSchema
> &
  CompliantReportingReferralRecord;

export type AlmostEligibleCriteriaRaw = {
  currentLevelEligibilityDate?: string;
  paymentNeeded?: boolean;
  recentRejectionCodes?: string[];
  seriousSanctionsEligibilityDate?: string;
};

export type CompliantReportingReferralRecord = {
  eligibilityCategory: string;
  lifetimeOffensesExpired: string[];
  pastOffenses: string[];
  /** Any number greater than zero indicates the client is _almost_ eligible. */
  remainingCriteriaNeeded: number;
  offenseTypeEligibility: string;
};
export type CompliantReportingFinesFeesEligible =
  | "low_balance"
  | "exempt"
  | "regular_payments";

export type SpecialConditionsStatus = "none" | "terminated" | "current";

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

type RawCompliantReportingReferralRecord = DocumentData & {
  drugScreensPastYear: {
    result: string;
    date: Timestamp | string;
  }[];
  zeroToleranceCodes?: { contactNoteType: string; contactNoteDate: string }[];
  almostEligibleCriteria?: AlmostEligibleCriteriaRaw;
  supervisionFeeExemptionType?: string[];
};

type compliantReportingInputSchema = z.input<typeof compliantReportingSchema>;

// Represents the actual schema we get from firestore, where if we have the zod fields they
// may be empty. Don't define them as partials above because the actual input to zod will have them,
// since we pre-transform them.
export type CompliantReportingReferralRecordFullRaw = {
  [k in keyof compliantReportingInputSchema]:
    | compliantReportingInputSchema[k]
    | Record<string, never>;
} & RawCompliantReportingReferralRecord;

export const transformCompliantReportingReferral: TransformFunction<
  CompliantReportingReferralRecordFull
> = (record) => {
  if (!record) {
    throw new Error("No record found");
  }

  const {
    currentOffenses,
    eligibilityCategory,
    lifetimeOffensesExpired,
    pastOffenses,
    remainingCriteriaNeeded,
    offenseTypeEligibility,
    tdocId,
    externalId,
    eligibleCriteria,
    ineligibleCriteria,
    formInformation,
    metadata,
  } = record as CompliantReportingReferralRecordFullRaw;

  // Make sure legacy fields aren't getting copied into the new record- we want to rely on their
  // new counterparts instead.
  const {
    drugScreensPastYear,
    sentenceStartDate,
    finesFeesEligible,
    supervisionFeeExemptionType,
    mostRecentArrestCheck,
    lastSpecialConditionsNote,
    nextSpecialConditionsCheck,
    specialConditionsFlag,
    specialConditionsTerminatedDate,
    almostEligibleCriteria,
    eligibleLevelStart,
    zeroToleranceCodes,
    allDockets,
    expirationDate,
    sentenceLengthDays,
    driversLicense,
    restitutionAmt,
    restitutionMonthlyPayment,
    restitutionMonthlyPaymentTo,
    courtCostsPaid,
    supervisionFeeAssessed,
    supervisionFeeArrearaged,
    supervisionFeeArrearagedAmount,
    supervisionFeeWaived,
    judicialDistrict,
    convictionCounties,
    ...recordWithoutLegacyFields
  } = record as RawCompliantReportingReferralRecord;
  const {
    paymentNeeded,
    seriousSanctionsEligibilityDate,
    recentRejectionCodes,
    currentLevelEligibilityDate,
    ...newAlmostEligibleCriteria
  } = almostEligibleCriteria ?? {};

  let oldStyleDockets;
  if (allDockets) {
    try {
      oldStyleDockets = JSON.parse(allDockets) as string[];
    } catch {
      oldStyleDockets = [allDockets];
    }
  }
  const newFormInformation: z.input<
    typeof compliantReportingSchema.shape.formInformation
  > =
    // We can't differentiate "0 offenses in new schema" from "not eligible in new schema" (and same
    // deal for other fields) so look at an arbitrary criteria instead to determine whether to look
    // at the old or new form fields
    eligibleCriteria.usTnNotServingIneligibleCrOffense !== undefined
      ? formInformation
      : {
          sentenceStartDate,
          expirationDate,
          sentenceLengthDays,
          currentOffenses,
          driversLicense,
          restitutionAmt,
          restitutionMonthlyPayment,
          restitutionMonthlyPaymentTo,
          courtCostsPaid,
          supervisionFeeAssessed,
          supervisionFeeArrearaged,
          supervisionFeeArrearagedAmount,
          currentExemptionsAndExpiration: supervisionFeeExemptionType?.map(
            (exemption) => ({
              exemptionReason: exemption,
              endDate: null, // This is null for all records in the old schema
            })
          ),
          supervisionFeeWaived: supervisionFeeWaived === "Fees Waived",
          docketNumbers: oldStyleDockets,
          judicialDistrict: judicialDistrict ? [judicialDistrict] : [],
        };
  let oldStyleSpeNote: z.input<
    typeof compliantReportingSchema.shape.metadata.shape.mostRecentSpeNote
  >;
  switch (specialConditionsFlag) {
    case "current":
      oldStyleSpeNote = {
        contactDate: lastSpecialConditionsNote,
        contactType: "SPEC",
      };
      break;
    case "terminated":
      oldStyleSpeNote = {
        contactDate: specialConditionsTerminatedDate,
        contactType: "SPET",
      };
      break;
    default:
      oldStyleSpeNote = undefined;
      break;
  }
  let newNoZeroToleranceCodesSpans: z.input<
    typeof compliantReportingSchema.shape.eligibleCriteria.shape.usTnNoZeroToleranceCodesSpans
  >;
  if (eligibleCriteria.usTnNoZeroToleranceCodesSpans !== undefined) {
    newNoZeroToleranceCodesSpans =
      eligibleCriteria.usTnNoZeroToleranceCodesSpans;
  } else if (eligibilityCategory === "c3" && zeroToleranceCodes?.length) {
    newNoZeroToleranceCodesSpans = {
      zeroToleranceCodeDates: zeroToleranceCodes?.map(
        (val) => val.contactNoteDate
      ),
    };
  } else {
    newNoZeroToleranceCodesSpans = null;
  }

  const newMetadata: z.input<typeof compliantReportingSchema.shape.metadata> = {
    mostRecentArrestCheck: {
      contactDate:
        mostRecentArrestCheck ?? metadata?.mostRecentArrestCheck?.contactDate,
      contactType: metadata?.mostRecentArrestCheck?.contactType ?? "ARRN",
    },
    mostRecentSpeNote: metadata.mostRecentSpeNote ?? oldStyleSpeNote,
    convictionCounties: metadata.convictionCounties?.length
      ? metadata.convictionCounties
      : convictionCounties,
  };
  const newEligibleCriteria: z.input<
    typeof compliantReportingSchema.shape.eligibleCriteria
  > = {
    usTnNoArrestsInPastYear: null, // This will always be null for eligible clients, and arrests aren't an almost eligible criteria
    usTnSpecialConditionsAreCurrent:
      eligibleCriteria.usTnSpecialConditionsAreCurrent ?? {
        speNoteDue: nextSpecialConditionsCheck ?? null,
      },
    usTnNotServingIneligibleCrOffense: null, // This will always be null for eligible clients, and ineligible offenses aren't an almost eligible criteria
    usTnPassedDrugScreenCheck: eligibleCriteria.usTnPassedDrugScreenCheck ?? {
      hasAtLeast1NegativeDrugTestPastYear: drugScreensPastYear.map((ds) => ({
        negativeScreenDate: ds.date,
        negativeScreenResult: ds.result,
      })),
      latestDrugTestIsNegative: drugScreensPastYear
        .map((ds) => ({
          latestDrugScreenDate: ds.date,
          latestDrugScreenResult: ds.result,
        }))
        .reduce((acc, current) => {
          return current.latestDrugScreenDate > acc.latestDrugScreenDate
            ? current
            : acc;
        }),
    },
    usTnNoZeroToleranceCodesSpans: newNoZeroToleranceCodesSpans,
  };
  const newIneligibleCriteria: z.input<
    typeof compliantReportingSchema.shape.ineligibleCriteria
  > = {};

  if (eligibleCriteria.usTnOnEligibleLevelForSufficientTime !== undefined) {
    newEligibleCriteria.usTnOnEligibleLevelForSufficientTime =
      eligibleCriteria.usTnOnEligibleLevelForSufficientTime;
  } else if (ineligibleCriteria.usTnOnEligibleLevelForSufficientTime) {
    newIneligibleCriteria.usTnOnEligibleLevelForSufficientTime =
      ineligibleCriteria.usTnOnEligibleLevelForSufficientTime;
  }
  // If they don't have new-style data, fill it in from the old style
  else if (currentLevelEligibilityDate) {
    newIneligibleCriteria.usTnOnEligibleLevelForSufficientTime = {
      eligibleDate: currentLevelEligibilityDate,
      // eligible level came from the client record in the old style, so we don't know it here.
      eligibleLevel: "UNKNOWN",
      startDateOnEligibleLevel: eligibleLevelStart,
    };
  } else {
    newEligibleCriteria.usTnOnEligibleLevelForSufficientTime = {
      // eligible date came from the almost eligible criteria in the old style, so we don't know it here.
      // We only use the eligible date in the copy for almost eligible, so it can be set to anything
      // when the client is eligible.
      eligibleDate: formatDateToISO(new Date()),
      // eligible level came from the client record in the old style, so we don't know it here.
      eligibleLevel: "UNKNOWN",
      startDateOnEligibleLevel: eligibleLevelStart,
    };
  }

  if (eligibleCriteria.usTnFinesFeesEligible) {
    newEligibleCriteria.usTnFinesFeesEligible =
      eligibleCriteria.usTnFinesFeesEligible;
  } else if (ineligibleCriteria.usTnFinesFeesEligible) {
    newIneligibleCriteria.usTnFinesFeesEligible =
      ineligibleCriteria.usTnFinesFeesEligible;
  }
  // If they don't have new-style data, fill it in from the old style
  else if (!paymentNeeded) {
    newEligibleCriteria.usTnFinesFeesEligible = {
      hasFinesFeesBalanceBelow500: {
        // Nothing in the copy or form looks at the actual value except to compare to 500, so it can be anything
        amountOwed: finesFeesEligible === "low_balance" ? 0 : 600,
      },
      hasPayments3ConsecutiveMonths: {
        amountOwed: 0, // same
        consecutiveMonthlyPayments: 0, // same
      },
      ...(supervisionFeeExemptionType && {
        hasPermanentFinesFeesExemption: {
          currentExemptions: supervisionFeeExemptionType,
        },
      }),
    };
  } else {
    newIneligibleCriteria.usTnFinesFeesEligible = {
      hasFinesFeesBalanceBelow500: {
        amountOwed: 0, // Nothing in the copy or form looks at the actual value so it can be anything
      },
      hasPayments3ConsecutiveMonths: {
        amountOwed: 0, // same
        consecutiveMonthlyPayments: 0, // same
      },
    };
  }

  if (eligibleCriteria.usTnNoHighSanctionsInPastYear !== undefined) {
    newEligibleCriteria.usTnNoHighSanctionsInPastYear =
      eligibleCriteria.usTnNoHighSanctionsInPastYear;
  } else if (ineligibleCriteria.usTnNoHighSanctionsInPastYear) {
    newIneligibleCriteria.usTnNoHighSanctionsInPastYear =
      ineligibleCriteria.usTnNoHighSanctionsInPastYear;
  }
  // If they don't have new-style data, fill it in from the old style
  else if (seriousSanctionsEligibilityDate) {
    newIneligibleCriteria.usTnNoHighSanctionsInPastYear = {
      latestHighSanctionDate: sub(
        fieldToDate(seriousSanctionsEligibilityDate),
        {
          years: 1,
        }
      ).toISOString(),
    };
  } else {
    newEligibleCriteria.usTnNoHighSanctionsInPastYear = null;
  }

  if (eligibleCriteria.usTnNoRecentCompliantReportingRejections !== undefined) {
    newEligibleCriteria.usTnNoRecentCompliantReportingRejections =
      eligibleCriteria.usTnNoRecentCompliantReportingRejections;
  } else if (
    ineligibleCriteria.usTnNoRecentCompliantReportingRejections !== undefined
  ) {
    newIneligibleCriteria.usTnNoRecentCompliantReportingRejections =
      ineligibleCriteria.usTnNoRecentCompliantReportingRejections;
  }
  // If they don't have new-style data, fill it in from the old style
  else if (recentRejectionCodes) {
    newIneligibleCriteria.usTnNoRecentCompliantReportingRejections = {
      contactCode: recentRejectionCodes,
    };
  } else {
    newEligibleCriteria.usTnNoRecentCompliantReportingRejections = null;
  }

  const recordForParsing = {
    ...recordWithoutLegacyFields,
    ...(Object.keys(newAlmostEligibleCriteria).length && {
      almostEligibleCriteria: newAlmostEligibleCriteria,
    }),
    externalId: externalId ?? tdocId,
    eligibleCriteria: newEligibleCriteria,
    ineligibleCriteria: newIneligibleCriteria,
    formInformation: newFormInformation,
    metadata: newMetadata,
  };

  const zodRecord = compliantReportingSchema
    .passthrough()
    .parse(recordForParsing);

  const transformedRecord: CompliantReportingReferralRecordFull = {
    ...zodRecord,
    eligibilityCategory,
    lifetimeOffensesExpired,
    pastOffenses,
    remainingCriteriaNeeded: remainingCriteriaNeeded ?? 0,
    offenseTypeEligibility,
  };

  return transformedRecord;
};
