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

import { Timestamp } from "firebase/firestore";

export type CompliantReportingFinesFeesEligible =
  | "low_balance"
  | "exempt"
  | "regular_payments";

export type SpecialConditionsStatus = "none" | "terminated" | "current";

export type CompliantReportingReferralRecord = {
  allDockets: string;
  almostEligibleCriteria?: {
    currentLevelEligibilityDate?: string;
    passedDrugScreenNeeded?: boolean;
    paymentNeeded?: boolean;
    recentRejectionCodes?: string[];
    seriousSanctionsEligibilityDate?: string;
  };
  clientFirstName: string;
  clientLastName: string;
  convictionCounty: string;
  courtName: string;
  courtCostsBalance: string;
  courtCostsMonthlyAmt1: string;
  courtCostsMonthlyAmt2: string;
  courtCostsPaid: boolean;
  currentEmployer: string;
  currentOffenses: string[];
  dateToday: string;
  driversLicense: string;
  driversLicenseSuspended: string;
  driversLicenseRevoked: string;
  drugScreensPastYear: { result: string; date: Timestamp | string }[];
  eligibilityCategory: string;
  eligibleLevelStart: Timestamp | string;
  expirationDate: string;
  finesFeesEligible: CompliantReportingFinesFeesEligible;
  judicialDistrict: string | null;
  lastSpecialConditionsNote?: string;
  lifetimeOffensesExpired: string[];
  mostRecentArrestCheck?: Timestamp | string;
  nextSpecialConditionsCheck?: Timestamp | string;
  pastOffenses: string[];
  physicalAddress: string;
  poFirstName: string;
  poLastName: string;
  /** Any number greater than zero indicates the client is _almost_ eligible.
   * In practice this field should not be optional once it is supported by ETL,
   * but for backwards compatibility it is for now
   */
  remainingCriteriaNeeded?: number;
  restitutionAmt: string;
  restitutionMonthlyPayment: string;
  restitutionMonthlyPaymentTo: string[];
  sanctionsPastYear: { ProposedSanction: string }[];
  sentenceStartDate: string;
  sentenceLengthDays: string;
  specialConditionsAlcDrugAssessment: string;
  specialConditionsAlcDrugAssessmentComplete: boolean;
  specialConditionsAlcDrugAssessmentCompleteDate: string;
  specialConditionsAlcDrugScreen: boolean;
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
  specialConditionsProgrammingFsw: boolean;
  specialConditionsProgrammingFswCompletionDate: string;
  specialConditionsProgrammingFswCurrent: boolean;
  specialConditionsProgramming: boolean;
  specialConditionsProgrammingCognitiveBehavior: boolean;
  specialConditionsProgrammingCognitiveBehaviorCompletionDate: string;
  specialConditionsProgrammingCognitiveBehaviorCurrent: boolean;
  specialConditionsProgrammingSafe: boolean;
  specialConditionsProgrammingSafeCompletionDate: string;
  specialConditionsProgrammingSafeCurrent: boolean;
  specialConditionsProgrammingVictimImpact: boolean;
  specialConditionsProgrammingVictimImpactCompletionDate: string;
  specialConditionsProgrammingVictimImpactCurrent: boolean;
  specialConditionsTerminatedDate?: string;
  stateCode: string;
  supervisionFeeArrearaged: boolean;
  supervisionFeeArrearagedAmount: number;
  supervisionFeeAssessed: number;
  supervisionFeeExemption: string;
  supervisionFeeExemptionExpirDate: string;
  supervisionFeeExemptionType: string;
  supervisionFeeWaived: string;
  supervisionType: string;
  tdocId: string;
  zeroToleranceCodes?: { contactNoteType: string; contactNoteDate: string }[];
};

export interface TransformedCompliantReportingReferral {
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
