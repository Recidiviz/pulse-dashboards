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

import type { Timestamp } from "firebase/firestore";

import {
  deriveRcafFormData,
  TRUSTEE_FORM_QUESTION_ORDER,
  UsTnInitialClassification2026DraftData,
  UsTnReclassification2026DraftData,
} from "~datatypes";

export type FormUpdateData = {
  data?: Partial<UsTnReclassification2026DraftData>;
  updated: {
    date: Timestamp;
    by: string;
  };
};

export type OpportunityUpdateData = {
  submitted: {
    date: Timestamp;
    by: string;
  };
};

export const OPP_TYPE_TO_COLLECTION = {
  usTnTrusteeTransfer: "US_TN-custodyLevelDowngrade2026PolicyReferrals",
  usTnSeriousMisconductUpgrade:
    "US_TN-custodyLevelDowngrade2026PolicyReferrals",
  usTnBiannualOther: "US_TN-custodyLevelDowngrade2026PolicyReferrals",
  usTnSpecialCustodyLevelUpgrade2026Policy:
    "US_TN-specialCustodyLevelUpgrade2026PolicyReferrals",
  usTnAnnualReclassification2026Policy:
    "US_TN-annualReclassification2026PolicyReferrals",
  usTnCustodyLevelDowngrade2026Policy:
    "US_TN-custodyLevelDowngrade2026PolicyReferrals",
  usTnInitialClassification2026Policy:
    "US_TN-initialClassification2026PolicyReferrals",

  usTnSpecialCustodyLevelUpgrade2026PolicyV2:
    "US_TN-specialCustodyLevelUpgrade2026PolicyV2Referrals",
  usTnAnnualReclassification2026PolicyV2:
    "US_TN-annualReclassification2026PolicyV2Referrals",
  usTnCustodyLevelDowngrade2026PolicyV2:
    "US_TN-custodyLevelDowngrade2026PolicyV2Referrals",
} as const;

// We can combine the RCAF and DCAF fields into one list since we are
// just checking to see if any of these are populated, not all.
export const allScoredQuestionFields = [
  "q1Selection",
  "q2Selection",
  "q3Selection",
  "q4Selection",
  "q5Selection",
  "q3Selection_0_6",
  "q3Selection_6_12",
  "q4Selection_0_6",
  "q4Selection_6_12",
  "q5Selection_0_6",
  "q5Selection_6_12",
  "q5Selection_12_18",
  "q5Selection_18_36",
  "q5Selection_36_60",
  "q6Selection",
  "q7Selection",
] as const;

// This record maps output fields to their source field in the derived data blob
// as well as which fields affect that field. This allows us to determine
// when a field was changed by the update record and record the output
export type DerivedDataMapping = Record<
  string,
  {
    sourceField: keyof ReturnType<typeof deriveRcafFormData>;
    relevantFields: readonly (keyof (UsTnReclassification2026DraftData &
      UsTnInitialClassification2026DraftData))[];
  }
>;

export const DERIVED_DATA_MAPPING_DCAF: DerivedDataMapping = {
  Question1: { sourceField: "q1Score", relevantFields: ["q1Selection"] },
  Question2: { sourceField: "q2Score", relevantFields: ["q2Selection"] },
  Question3: { sourceField: "q3Score", relevantFields: ["q3Selection"] },
  Question4: { sourceField: "q4Score", relevantFields: ["q4Selection"] },
  Question5: { sourceField: "q5Score", relevantFields: ["q5Selection"] },
  Question6: { sourceField: "q6Score", relevantFields: ["q6Selection"] },
  Question7: { sourceField: "q7Score", relevantFields: ["q7Selection"] },
  OverallScore: {
    sourceField: "totalScore",
    relevantFields: allScoredQuestionFields,
  },
  ScoredCustodyLevel: {
    sourceField: "totalText",
    relevantFields: allScoredQuestionFields,
  },

  TrusteeEligible: {
    sourceField: "trusteeEligible",
    relevantFields: TRUSTEE_FORM_QUESTION_ORDER,
  },
};

export const DERIVED_DATA_MAPPING_RCAF: DerivedDataMapping = {
  ...DERIVED_DATA_MAPPING_DCAF,
  Question3: {
    sourceField: "q3Score",
    relevantFields: ["q3Selection_0_6", "q3Selection_6_12"],
  },
  Question4: {
    sourceField: "q4Score",
    relevantFields: ["q4Selection_0_6", "q4Selection_6_12"],
  },
  Question5: {
    sourceField: "q5Score",
    relevantFields: [
      "q5Selection_0_6",
      "q5Selection_6_12",
      "q5Selection_12_18",
      "q5Selection_18_36",
      "q5Selection_36_60",
    ],
  },
};

export const CSV_COLUMN_ORDER = [
  "state_code",
  "OFFENDERID",
  "ClassificationType",
  "ClassificationFormType",
  "AssessmentDate",
  "LastClassificationDate",
  "LastModifiedBy",
  "Question1",
  "Question1_notes",
  "Question2",
  "Question2_notes",
  "Question3",
  "Question3_notes",
  "Question4",
  "Question4_notes",
  "Question5",
  "Question5_notes",
  "Question6",
  "Question6_notes",
  "Question7",
  "Question7_notes",
  "OverallScore",
  "ScoredCustodyLevel",
  "CounselorRecommendedOverride",
  "CounselorRecommendedCustodyLevel",
  "FinalOverrideCode",
  "FinalCustodyLevel",
  "DateOfApprovalAndEntry_CAF",
  "TrusteeFlag",
  "Trustee_Question1",
  "Trustee_Question2",
  "Trustee_Question3",
  "Trustee_Question4",
  "Trustee_Question5",
  "Trustee_Question6",
  "Trustee_Question7",
  "Trustee_Question8",
  "Trustee_Question9",
  "Trustee_Question10",
  "Trustee_Question11",
  "Trustee_Question12",
  "Trustee_Question13",
  "DateOfApprovalAndEntry_Trustee",
  "TrusteeApprovedOrDenied",
  "TrusteeEligible",
  "TrusteeDenialReasons",
  "Warden_TrusteeSignaturesAcquired",
  "Warden_TrusteeSignaturesAcquiredDate",
  "ContractMonitor_TrusteeSignaturesAcquired",
  "ContractMonitor_TrusteeSignaturesAcquiredDate",
  "AC_TrusteeSignaturesAcquired",
  "AC_TrusteeSignaturesAcquiredDate",
  "ChiefCounselorFinalizingForm",
  "TrusteeChecklistComplete",
  "DateOfFinalApprovalAndEntry",
  "LastModifiedDate",
  "UpdatedFields",
  "SummaryTrusteeEverConvictedOfFirstDegreeMurder",
  "SummaryTrusteeServingLifeSentence",
  "SummaryTrusteeMoreThan10YearRemaining",
  "SummaryTrusteeAllNoTrusteeCompleted",
];
