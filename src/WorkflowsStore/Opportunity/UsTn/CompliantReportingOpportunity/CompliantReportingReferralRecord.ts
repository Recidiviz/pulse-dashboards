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

import { TransformFunction } from "../../../subscriptions";
import { fieldToDate, optionalFieldToDate } from "../../../utils";
import { dateStringSchema, opportunitySchemaBase } from "../../schemaHelpers";

export const compliantReportingSchema = opportunitySchemaBase.extend({
  eligibleCriteria: z.object({
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
    usTnNotServingIneligibleCrOffense: z.null().transform((_val) => ({})),
  }),
  ineligibleCriteria: z.object({
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
  formInformation: z.object({
    sentenceStartDate: dateStringSchema.optional(),
    currentOffenses: z.array(z.string()),
  }),
  metadata: z
    .object({
      mostRecentArrestCheck: z.object({
        contactDate: dateStringSchema,
        contactType: z.literal("ARRN"),
      }),
    })
    .passthrough(), // temporary passthrough to allow fixture data with metadata fields we haven't accounted for yet
});

export type CompliantReportingReferralRecordFull = z.infer<
  typeof compliantReportingSchema
> &
  CompliantReportingReferralRecord;

export type AlmostEligibleCriteria = {
  currentLevelEligibilityDate?: Date;
  passedDrugScreenNeeded?: boolean;
};

export type AlmostEligibleCriteriaRaw = {
  currentLevelEligibilityDate?: string;
  passedDrugScreenNeeded?: boolean;
  paymentNeeded?: boolean;
  recentRejectionCodes?: string[];
  seriousSanctionsEligibilityDate?: string;
};

export type CompliantReportingReferralRecord = {
  almostEligibleCriteria?: AlmostEligibleCriteria;
  eligibilityCategory: string;
  eligibleLevelStart?: Date;
  drugScreensPastYear: { result: string; date: Date }[];
  judicialDistrict: string;
  lastSpecialConditionsNote?: Date | undefined;
  lifetimeOffensesExpired: string[];
  nextSpecialConditionsCheck?: Date | undefined;
  pastOffenses: string[];
  /** Any number greater than zero indicates the client is _almost_ eligible. */
  remainingCriteriaNeeded: number;
  specialConditionsFlag?: SpecialConditionsStatus;
  specialConditionsTerminatedDate?: Date | undefined;
  zeroToleranceCodes: { contactNoteType: string; contactNoteDate: Date }[];
  offenseTypeEligibility: string;
};
export type CompliantReportingFinesFeesEligible =
  | "low_balance"
  | "exempt"
  | "regular_payments";

export type SpecialConditionsStatus = "none" | "terminated" | "current";

export interface CompliantReportingDraftData {
  /* Computed fields */
  clientFullName: string;
  poFullName: string;
  restitutionMonthlyPaymentTo: string;
  sentenceLengthDaysText: string;
  specialConditionsCounselingAngerManagementComplete: boolean;
  specialConditionsCounselingMentalHealthComplete: boolean;

  /* Converted fields */
  supervisionFeeAssessed: string;
  supervisionFeeArrearagedAmount: string;

  /* Fields directly passed from ETL */
  allDockets: string;
  clientFirstName: string;
  clientLastName: string;
  convictionCounty: string;
  courtCostsBalance: string;
  courtCostsMonthlyAmt1: string;
  courtCostsMonthlyAmt2: string;
  courtCostsPaid: boolean;
  courtName: string;
  currentEmployer: string;
  currentOffenses: string[];
  dateToday: string;
  driversLicense: string;
  driversLicenseRevoked: string;
  driversLicenseSuspended: string;
  expirationDate: string;
  lastSpecialConditionsNote?: string;
  nextSpecialConditionsCheck?: Timestamp | string;
  pastOffenses: string[];
  physicalAddress: string;
  poFirstName: string;
  poLastName: string;
  remainingCriteriaNeeded?: number;
  restitutionAmt: string;
  restitutionMonthlyPayment: string;
  sentenceLengthDays: string;
  sentenceStartDate: string;
  specialConditionsAlcDrugScreen: boolean;
  specialConditionsAlcDrugAssessment: string;
  specialConditionsAlcDrugAssessmentComplete: boolean;
  specialConditionsAlcDrugAssessmentCompleteDate: string;
  specialConditionsAlcDrugScreenDate: string;
  specialConditionsAlcDrugTreatment: boolean;
  specialConditionsAlcDrugTreatmentCompleteDate: string;
  specialConditionsAlcDrugTreatmentCurrent: boolean;
  specialConditionsAlcDrugTreatmentInOut: "INPATIENT" | "OUTPATIENT";
  specialConditionsCommunityService: boolean;
  specialConditionsCommunityServiceCompletionDate: string;
  specialConditionsCommunityServiceCurrent: boolean;
  specialConditionsCommunityServiceHours: string;
  specialConditionsCounseling: boolean;
  specialConditionsCounselingAngerManagement: boolean;
  specialConditionsCounselingAngerManagementCompleteDate: string;
  specialConditionsCounselingAngerManagementCurrent: boolean;
  specialConditionsCounselingMentalHealth: boolean;
  specialConditionsCounselingMentalHealthCompleteDate: string;
  specialConditionsCounselingMentalHealthCurrent: boolean;
  specialConditionsFlag: SpecialConditionsStatus;
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
  supervisionFeeArrearaged: boolean;
  supervisionFeeExemptionExpirDate: string;
  supervisionFeeExemptionType: string;
  supervisionFeeWaived: string;
  supervisionType: string;
  tdocId: string;

  /* Fields in the UI that are not included in the ETL */
  currentOffenses0: string;
  currentOffenses1: string;
  currentOffenses2: string;
  currentOffenses3: string;
  currentOffenses4: string;
  licenseYears: string;
  telephoneNumber: string;
  supervisorFullName: string;
  iotSanctioning: boolean;
  atrSupervisionTransfer: boolean;
  seeAdditionalOffenses: boolean;
  isProbation: boolean;
  isIsc: boolean;
  isParole: boolean;
  is4035313: boolean;
  specialConditionsAlcDrugTreatmentIsInpatient: boolean;
  specialConditionsAlcDrugTreatmentIsOutpatient: boolean;
  specialConditionsNoContact: boolean;
  specialConditionsNoContactName: string;
  specialConditionsSocialWorker: boolean;
  specialConditionsAlcDrugAssessmentPending: boolean;
  specialConditionsAlcDrugTreatmentComplete: boolean;
  specialConditionsCounselingComplete: boolean;
  specialConditionsCommunityServiceComplete: boolean;
  specialConditionsProgrammingCognitiveBehaviorComplete: boolean;
  specialConditionsProgrammingSafeComplete: boolean;
  specialConditionsProgrammingVictimImpactComplete: boolean;
  specialConditionsProgrammingFswComplete: boolean;
}

type RawCompliantReportingReferralRecord = DocumentData & {
  drugScreensPastYear: {
    result: string;
    date: Timestamp | string;
  }[];
  zeroToleranceCodes?: { contactNoteType: string; contactNoteDate: string }[];
  almostEligibleCriteria?: AlmostEligibleCriteriaRaw;
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
    drugScreensPastYear,
    eligibilityCategory,
    eligibleLevelStart,
    judicialDistrict,
    lastSpecialConditionsNote,
    lifetimeOffensesExpired,
    nextSpecialConditionsCheck,
    pastOffenses,
    remainingCriteriaNeeded,
    specialConditionsFlag,
    specialConditionsTerminatedDate,
    zeroToleranceCodes,
    offenseTypeEligibility,
    tdocId,
    eligibleCriteria,
    ineligibleCriteria,
    formInformation,
    metadata,
  } = record as CompliantReportingReferralRecordFullRaw;

  // Make sure legacy fields aren't getting copied into the new record- we want to rely on their
  // new counterparts instead.
  const {
    sentenceStartDate,
    finesFeesEligible,
    supervisionFeeExemptionType,
    mostRecentArrestCheck,
    almostEligibleCriteria,
    ...recordWithoutLegacyFields
  } = record;
  const {
    paymentNeeded,
    seriousSanctionsEligibilityDate,
    recentRejectionCodes,
    ...newAlmostEligibleCriteria
  } = almostEligibleCriteria ?? {};

  const newFormInformation: z.input<
    typeof compliantReportingSchema.shape.formInformation
  > = {
    sentenceStartDate: formInformation.sentenceStartDate ?? sentenceStartDate,
    currentOffenses:
      // We can't differentiate "0 offenses in new schema" from "not eligible in new schema" so look at the criteria instead
      eligibleCriteria.usTnNotServingIneligibleCrOffense !== undefined
        ? formInformation.currentOffenses
        : currentOffenses,
  };
  const newMetadata: z.input<typeof compliantReportingSchema.shape.metadata> = {
    mostRecentArrestCheck: {
      contactDate:
        mostRecentArrestCheck ?? metadata?.mostRecentArrestCheck?.contactDate,
      contactType: metadata?.mostRecentArrestCheck?.contactType ?? "ARRN",
    },
  };
  const newEligibleCriteria: z.input<
    typeof compliantReportingSchema.shape.eligibleCriteria
  > = {
    usTnNoArrestsInPastYear: null, // This will always be null for eligible clients, and arrests aren't an almost eligible criteria
    usTnNotServingIneligibleCrOffense: null, // This will always be null for eligible clients, and ineligible offenses aren't an almost eligible criteria
  };
  const newIneligibleCriteria: z.input<
    typeof compliantReportingSchema.shape.ineligibleCriteria
  > = {};

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
    externalId: tdocId,
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
    eligibleLevelStart: optionalFieldToDate(eligibleLevelStart),
    drugScreensPastYear: drugScreensPastYear.map(({ result, date }) => ({
      result,
      date: fieldToDate(date),
    })),
    judicialDistrict: judicialDistrict ?? "Unknown",
    lastSpecialConditionsNote: optionalFieldToDate(lastSpecialConditionsNote),
    lifetimeOffensesExpired,
    nextSpecialConditionsCheck: optionalFieldToDate(nextSpecialConditionsCheck),
    pastOffenses,
    remainingCriteriaNeeded: remainingCriteriaNeeded ?? 0,
    specialConditionsTerminatedDate: optionalFieldToDate(
      specialConditionsTerminatedDate
    ),
    specialConditionsFlag,
    zeroToleranceCodes:
      zeroToleranceCodes?.map(({ contactNoteDate, contactNoteType }) => ({
        contactNoteType,
        contactNoteDate: new Date(contactNoteDate),
      })) ?? [],
    offenseTypeEligibility,
  };

  if (almostEligibleCriteria) {
    const { currentLevelEligibilityDate, passedDrugScreenNeeded } =
      almostEligibleCriteria;

    transformedRecord.almostEligibleCriteria = {
      currentLevelEligibilityDate: optionalFieldToDate(
        currentLevelEligibilityDate
      ),
      passedDrugScreenNeeded,
    };
  }

  return transformedRecord;
};
