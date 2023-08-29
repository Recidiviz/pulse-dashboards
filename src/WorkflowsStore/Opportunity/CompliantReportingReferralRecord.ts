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

import { DocumentData, Timestamp } from "firebase/firestore";
import { z } from "zod";

import { TransformFunction } from "../subscriptions";
import { fieldToDate, optionalFieldToDate } from "../utils";
import { dateStringSchema, opportunitySchemaBase } from "./schemaHelpers";

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
  }),
  formInformation: z
    .object({
      sentenceStartDate: dateStringSchema,
    })
    .partial(), // If a user is only eligible in the older schema, no values will be set
});

export type CompliantReportingReferralRecordFull = Omit<
  z.infer<typeof compliantReportingSchema> & CompliantReportingReferralRecord,
  "sentenceStartDate" | "finesFeesEligible" | "supervisionFeeExemption"
>;

export type AlmostEligibleCriteria = {
  currentLevelEligibilityDate?: Date;
  passedDrugScreenNeeded?: boolean;
  recentRejectionCodes?: string[];
  seriousSanctionsEligibilityDate?: Date;
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
  currentOffenses: string[];
  eligibilityCategory: string;
  eligibleLevelStart?: Date;
  drugScreensPastYear: { result: string; date: Date }[];
  judicialDistrict: string;
  lastSpecialConditionsNote?: Date | undefined;
  lifetimeOffensesExpired: string[];
  mostRecentArrestCheck: Date;
  nextSpecialConditionsCheck?: Date | undefined;
  pastOffenses: string[];
  /** Any number greater than zero indicates the client is _almost_ eligible. */
  remainingCriteriaNeeded: number;
  sanctionsPastYear: { type: string }[];
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
  sanctionsPastYear?: { ProposedSanction: string }[];
  zeroToleranceCodes?: { contactNoteType: string; contactNoteDate: string }[];
  almostEligibleCriteria?: AlmostEligibleCriteriaRaw;
};

export type CompliantReportingReferralRecordFullRaw = z.input<
  typeof compliantReportingSchema
> &
  RawCompliantReportingReferralRecord;

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
    mostRecentArrestCheck,
    nextSpecialConditionsCheck,
    pastOffenses,
    remainingCriteriaNeeded,
    sanctionsPastYear,
    specialConditionsFlag,
    specialConditionsTerminatedDate,
    zeroToleranceCodes,
    offenseTypeEligibility,
    tdocId,
    eligibleCriteria,
    ineligibleCriteria,
    formInformation,
  } = record as CompliantReportingReferralRecordFullRaw;

  // Make sure legacy fields aren't getting copied into the new record- we want to rely on their
  // new counterparts instead.
  const {
    sentenceStartDate,
    finesFeesEligible,
    supervisionFeeExemptionType,
    almostEligibleCriteria,
    ...recordWithoutLegacyFields
  } = record;
  const { paymentNeeded, ...newAlmostEligibleCriteria } =
    almostEligibleCriteria ?? {};

  const newFormInformation: z.input<
    typeof compliantReportingSchema.shape.formInformation
  > = {
    sentenceStartDate: sentenceStartDate ?? formInformation?.sentenceStartDate,
  };
  const newEligibleCriteria: z.input<
    typeof compliantReportingSchema.shape.eligibleCriteria
  > = {};
  const newIneligibleCriteria: z.input<
    typeof compliantReportingSchema.shape.ineligibleCriteria
  > = {};

  if (
    finesFeesEligible !== "ineligible" &&
    !eligibleCriteria.usTnFinesFeesEligible
  ) {
    // If the legacy-style data tells us they're eligible but the new style doesn't, set the new
    // fields to match what the legacy data is telling us.
    newEligibleCriteria.usTnFinesFeesEligible = {
      hasFinesFeesBalanceBelow500: {
        amountOwed: 0, // Nothing in the copy or form looks at the actual value so it can be anything
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
  } else if (paymentNeeded && !ineligibleCriteria.usTnFinesFeesEligible) {
    // If the legacy-style data tells us they're almost eligible but the new style doesn't, set the
    // new fields to match what the legacy data is telling us.
    newIneligibleCriteria.usTnFinesFeesEligible = {
      hasFinesFeesBalanceBelow500: {
        amountOwed: 0, // Nothing in the copy or form looks at the actual value so it can be anything
      },
      hasPayments3ConsecutiveMonths: {
        amountOwed: 0, // same
        consecutiveMonthlyPayments: 0, // same
      },
    };
  } else {
    // if the old and new eligibility match each other, keep both
    if (eligibleCriteria.usTnFinesFeesEligible) {
      newEligibleCriteria.usTnFinesFeesEligible =
        eligibleCriteria.usTnFinesFeesEligible;
    }
    if (ineligibleCriteria.usTnFinesFeesEligible) {
      newIneligibleCriteria.usTnFinesFeesEligible =
        ineligibleCriteria.usTnFinesFeesEligible;
    }
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
  };

  const zodRecord = compliantReportingSchema
    .passthrough()
    .parse(recordForParsing);

  const transformedRecord: CompliantReportingReferralRecordFull = {
    ...zodRecord,
    currentOffenses,
    eligibilityCategory,
    eligibleLevelStart: optionalFieldToDate(eligibleLevelStart),
    drugScreensPastYear: drugScreensPastYear.map(({ result, date }) => ({
      result,
      date: fieldToDate(date),
    })),
    judicialDistrict: judicialDistrict ?? "Unknown",
    lastSpecialConditionsNote: optionalFieldToDate(lastSpecialConditionsNote),
    lifetimeOffensesExpired,
    mostRecentArrestCheck: fieldToDate(mostRecentArrestCheck),
    nextSpecialConditionsCheck: optionalFieldToDate(nextSpecialConditionsCheck),
    pastOffenses,
    remainingCriteriaNeeded: remainingCriteriaNeeded ?? 0,
    sanctionsPastYear:
      sanctionsPastYear?.map(({ ProposedSanction }) => ({
        type: ProposedSanction,
      })) ?? [],
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
    const {
      currentLevelEligibilityDate,
      passedDrugScreenNeeded,
      recentRejectionCodes,
      seriousSanctionsEligibilityDate,
    } = almostEligibleCriteria;

    transformedRecord.almostEligibleCriteria = {
      currentLevelEligibilityDate: optionalFieldToDate(
        currentLevelEligibilityDate
      ),
      seriousSanctionsEligibilityDate: optionalFieldToDate(
        seriousSanctionsEligibilityDate
      ),
      passedDrugScreenNeeded,
      recentRejectionCodes,
    };
  }

  return transformedRecord;
};
