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
