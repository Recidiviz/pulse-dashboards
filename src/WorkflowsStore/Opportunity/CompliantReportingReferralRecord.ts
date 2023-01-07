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

import { UNKNOWN } from "../Client";
import { TransformFunction } from "../subscriptions";
import { fieldToDate, optionalFieldToDate } from "../utils";

export type AlmostEligibleCriteria = {
  currentLevelEligibilityDate?: Date;
  passedDrugScreenNeeded?: boolean;
  paymentNeeded?: boolean;
  recentRejectionCodes?: string[];
  seriousSanctionsEligibilityDate?: Date;
};

export type CompliantReportingReferralRecord = {
  almostEligibleCriteria?: AlmostEligibleCriteria;
  currentOffenses: string[];
  eligibilityCategory: string;
  eligibleLevelStart?: Date;
  drugScreensPastYear: { result: string; date: Date }[];
  finesFeesEligible: CompliantReportingFinesFeesEligible;
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
  supervisionFeeExemption?: string;
  zeroToleranceCodes: { contactNoteType: string; contactNoteDate: Date }[];
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
  supervisionFeeExemption: string;
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
};

export const transformCompliantReportingReferral: TransformFunction<
  CompliantReportingReferralRecord
> = (record) => {
  if (!record) {
    throw new Error("No record found");
  }

  const {
    almostEligibleCriteria,
    currentOffenses,
    drugScreensPastYear,
    eligibilityCategory,
    eligibleLevelStart,
    finesFeesEligible,
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
    supervisionFeeExemption,
    zeroToleranceCodes,
    ...data
  } = record as RawCompliantReportingReferralRecord;

  const transformedRecord: CompliantReportingReferralRecord = {
    ...data,
    currentOffenses,
    eligibilityCategory,
    eligibleLevelStart: optionalFieldToDate(eligibleLevelStart),
    drugScreensPastYear: drugScreensPastYear.map(({ result, date }) => ({
      result,
      date: fieldToDate(date),
    })),
    finesFeesEligible,
    judicialDistrict: judicialDistrict ?? UNKNOWN,
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
    supervisionFeeExemption,
    zeroToleranceCodes:
      zeroToleranceCodes?.map(({ contactNoteDate, contactNoteType }) => ({
        contactNoteType,
        contactNoteDate: new Date(contactNoteDate),
      })) ?? [],
  };

  if (almostEligibleCriteria) {
    const {
      currentLevelEligibilityDate,
      passedDrugScreenNeeded,
      paymentNeeded,
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
      paymentNeeded,
      recentRejectionCodes,
    };
  }

  return transformedRecord;
};
