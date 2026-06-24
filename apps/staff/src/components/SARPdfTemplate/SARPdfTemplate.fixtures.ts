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

// Local-only mock data for the SARPdfTemplate examples runner. Colocated with
// the examples (not the library) and fully synthetic — all names, identifiers,
// dates of birth, contact details, and case/cause numbers are fabricated. The
// shape mirrors the getSAR / getSARInsight tRPC responses so the template is
// exercised against the real response structure. Date fields are real `Date`
// objects because the tRPC client superjson-deserializes them.
// =============================================================================

import type { SAR, SARInsight } from "~sentencing-client";

/** Synthetic getSAR response (mostly-empty histories — exercises fallback paths). */
export const mockSAR: SAR = {
  externalId: "SAR-EX-0001",
  id: "sar-id-0001",
  updatedAt: new Date("2026-05-29T17:32:19.019Z"),
  status: "InProgress",
  dueDate: null,
  courtDate: null,
  completionDate: new Date(),
  requestingJudgeName: "DOE, JORDAN",
  dateRequested: new Date("2026-01-12T00:00:00.000Z"),
  division: "3",
  address: null,
  defendantDeclinedToParticipate: false,
  needsToBeAddressed: [
    "SubstanceUse",
    "MentalHealth",
    "JobTrainingOrOpportunities",
    "HousingOpportunities",
  ],
  otherNeedToBeAddressed: null,
  mitigatingFactors: [
    "NoHistoryOfViolentBehavior",
    "CloseFamilyTies",
    "HistoryOfSuccessUnderSupervision",
  ],
  otherMitigatingFactor: null,
  levelOfEducation: null,
  assessmentScore: 26,
  assessmentType: "ORAS_CST",
  assessmentDate: new Date("2026-01-29T00:00:00.000Z"),
  assessmentAdministeredBy: "Casey Officer",
  criminalHistoryLevel: 3,
  educationLevelScore: 3,
  neighborhoodLevel: 3,
  substanceAbuseLevel: 4,
  familySocialSupportLevel: 2,
  peerAssociatesLevel: 5,
  criminalBehaviorLevel: 6,
  responsivityLevel: null,
  criminalHistoryRiskLevel: "LOW",
  educationRiskLevel: "MODERATE",
  neighborhoodRiskLevel: "HIGH",
  substanceAbuseRiskLevel: "MODERATE",
  familySocialSupportRiskLevel: "MODERATE",
  peerAssociatesRiskLevel: "HIGH",
  criminalBehaviorRiskLevel: "MODERATE",
  defendantStatement:
    "Lorem ipsum dolor sit amet, consectetur adipiscing elit, sed do eiusmod tempor incididunt ut labore et dolore magna aliqua. ",
  victimImpactStatement: null,
  criminalHistorySummary:
    "The defendant's complete criminal history is attached to this report.",
  employedAtOffense: null,
  employmentSummary: null,
  familyAndSocialSupportSummary: null,
  homePlan: null,
  housingSummary: null,
  drugHistorySummary: null,
  peerAssociatesSummary: null,
  criminalAttitudesSummary: null,
  responsivityAndBarriersSummary: null,
  communityStrategyRecommendation: null,
  institutionalStrategyRecommendation: null,
  priorTreatmentHistorySummary: null,
  mostSevereOffenseName: "UNLAWFUL POSSESSION OF A FIREARM",
  metadata: null,
  officerSignature: null,
  officerTitle: null,
  officerLastSignedAt: null,
  supervisorSignature: null,
  supervisorTitle: null,
  supervisorLastSignedAt: null,
  staff: {
    externalId: "E0000001",
    pseudonymizedId: "pseudo-0001",
    fullName: "Casey J Officer",
    email: "casey.officer@example.com",
    officeAddress: "123 Example St, Anytown, MO 00000",
    officePhoneNumber: "555-555-0100",
    district: { name: "District 0 - Example" },
  },
  charges: [
    {
      id: "charge-0001",
      chargeExternalId: "SAR-EX-0001-1",
      offense: "POSSESSION OF CONTROLLED SUBSTANCE",
      classificationType: "FELONY",
      classificationSubtype: "D",
      causeNum: "00XX-CR00000-01",
      moCode: "35ADN990",
      judgeNames: ["DOE, JORDAN"],
      county: "Example",
      division: "3",
      prosecutingAttorney: null,
      defenseAttorney: null,
      pleaAgreement: null,
      pleaDate: null,
      sentencingDate: null,
    },
    {
      id: "charge-0002",
      chargeExternalId: "SAR-EX-0001-2",
      offense: "UNLAWFUL POSSESSION OF A FIREARM",
      classificationType: "FELONY",
      classificationSubtype: "C",
      causeNum: "00XX-CR00001-01",
      moCode: "52ADM120",
      judgeNames: ["DOE, JORDAN"],
      county: "Example",
      division: "3",
      prosecutingAttorney: null,
      defenseAttorney: null,
      pleaAgreement: null,
      pleaDate: null,
      sentencingDate: null,
    },
    {
      id: "charge-0003",
      chargeExternalId: "SAR-EX-0001-4",
      offense: "POSSESSION OF CONTROLLED SUBSTANCE",
      classificationType: "FELONY",
      classificationSubtype: "D",
      causeNum: "00XX-CR00001-01",
      moCode: "35ADN990",
      judgeNames: ["DOE, JORDAN"],
      county: "Example",
      division: "3",
      prosecutingAttorney: null,
      defenseAttorney: null,
      pleaAgreement: null,
      pleaDate: null,
      sentencingDate: null,
    },
    {
      id: "charge-0004",
      chargeExternalId: "SAR-EX-0001-3",
      offense:
        "UNLAWFUL USE OF WEAPON - SUBSECTION 11 - POSSESS WEAPON AND A FELONY CONTROLLED SUBSTANCE",
      classificationType: "FELONY",
      classificationSubtype: "E",
      causeNum: "00XX-CR00001-01",
      moCode: "52ABR990",
      judgeNames: ["DOE, JORDAN"],
      county: "Example",
      division: "3",
      prosecutingAttorney: null,
      defenseAttorney: null,
      pleaAgreement: null,
      pleaDate: null,
      sentencingDate: null,
    },
  ],
  drugHistories: [],
  employmentHistories: [],
  priorTreatmentHistories: [],
  client: {
    fullName: "JORDAN A SAMPLE",
    gender: "MALE",
    raceOrEthnicity: ["BLACK"],
    externalId: "EX0000001",
    birthDate: new Date("1990-01-01T00:00:00.000Z"),
    motherName: null,
    fatherName: null,
    guardianName: null,
    DOCTreatmentHistories: [
      {
        id: "doc-tx-1",
        programCategory: "Cognitive",
        programName: "PATHWAY TO CHANGE",
        completedOn: new Date("2018-03-29T00:00:00.000Z"),
      },
      {
        id: "doc-tx-2",
        programCategory: "Cognitive",
        programName: "PATHWAY TO CHANGE",
        completedOn: new Date("2015-06-10T00:00:00.000Z"),
      },
      {
        id: "doc-tx-3",
        programCategory: "InstitutionalTreatment",
        programName: "SHORT TERM (559.115, 217.785, BOARD)",
        completedOn: new Date("2018-04-14T00:00:00.000Z"),
      },
      {
        id: "doc-tx-4",
        programCategory: "Education",
        programName: "HIGH SCHOOL EQUIVALENCY CONTRACTED/MOU",
        completedOn: new Date("2018-04-14T00:00:00.000Z"),
      },
      {
        id: "doc-tx-5",
        programCategory: "Cognitive",
        programName: "PATHWAY TO CHANGE",
        completedOn: new Date("2015-03-05T00:00:00.000Z"),
      },
    ],
  },
  // The SAR type also carries computed fields (age, client.firstName/lastName)
  // not present in the wire payload, so cast through unknown.
} as unknown as SAR;

/** Synthetic getSARInsight response for the same offense/gender/bucket. */
export const mockSARInsight: SARInsight = {
  gender: "MALE",
  assessmentScoreBucketStart: 2,
  assessmentScoreBucketEnd: 2,
  rollupGender: "MALE",
  rollupAssessmentScoreBucketStart: null,
  rollupAssessmentScoreBucketEnd: null,
  dispositionData: [
    {
      recommendationType: "Deferred_prosecution",
      sentenceLengthBucketStart: 0,
      sentenceLengthBucketEnd: -1,
      percentage: 0.007532956685499058,
    },
    {
      recommendationType: "Incarceration",
      sentenceLengthBucketStart: 1,
      sentenceLengthBucketEnd: 2,
      percentage: 0.03954802259887006,
    },
    {
      recommendationType: "Incarceration",
      sentenceLengthBucketStart: 3,
      sentenceLengthBucketEnd: 5,
      percentage: 0.3314500941619586,
    },
    {
      recommendationType: "Incarceration",
      sentenceLengthBucketStart: 6,
      sentenceLengthBucketEnd: -1,
      percentage: 0.1751412429378531,
    },
    {
      recommendationType: "Probation",
      sentenceLengthBucketStart: 0,
      sentenceLengthBucketEnd: -1,
      percentage: 0,
    },
    {
      recommendationType: "Suspended",
      sentenceLengthBucketStart: 0,
      sentenceLengthBucketEnd: -1,
      percentage: 0.3352165725047081,
    },
    {
      recommendationType: "Treatment_in_prison",
      sentenceLengthBucketStart: 0,
      sentenceLengthBucketEnd: -1,
      percentage: 0.1111111111111111,
    },
  ],
  dispositionNumRecords: 531,
  rollupRecidivismSeries: [],
  rollupRecidivismNumRecords: 1535,
  avgSentenceLengthYears: 5,
  avgPctServed: 65.3,
  timeServedNumRecords: 148,
  offense: "UNLAWFUL POSSESSION OF A FIREARM",
  offenseCategory: null,
  rollupOffenseName: "UNLAWFUL POSSESSION OF A FIREARM",
  rollupOffenseDescription: "UNLAWFUL POSSESSION OF A FIREARM offenses",
} as unknown as SARInsight;

/**
 * A richer variant that fills the histories, narratives, recommendations and
 * level-of-education that the record above leaves empty — so visual iteration
 * still covers the Education/Employment + Substance Use + Community Treatment
 * tables and the Recommendation sections.
 */
export const mockSARPopulated: SAR = {
  ...mockSAR,
  levelOfEducation: "HighSchoolDiplomaOrGED",
  employedAtOffense: true,
  defendantStatement:
    "The defendant maintains that the firearm was not his and that he was unaware it was in the vehicle.",
  victimImpactStatement: "No victim impact statement was submitted.",
  drugHistorySummary:
    "The defendant reports a history of substance use beginning in his late teens.",
  peerAssociatesSummary:
    "The defendant associates with several individuals who have prior justice involvement.",
  criminalAttitudesSummary:
    "The defendant expressed remorse and a willingness to engage with treatment.",
  responsivityAndBarriersSummary:
    "Transportation to programming may be a barrier; the defendant lacks a reliable vehicle.",
  communityStrategyRecommendation:
    "Enroll in outpatient substance use treatment.\nMaintain steady employment.\nReport weekly to the supervising officer.",
  institutionalStrategyRecommendation:
    "Complete a cognitive-behavioral program.\nParticipate in vocational training.",
  homePlan: "The defendant intends to reside with a relative upon release.",
  priorTreatmentHistorySummary:
    "The defendant participated in community-based outpatient counseling in 2021.",
  priorTreatmentHistories: [
    {
      id: "ptx-1",
      yearCompleted: 2021,
      programName: "Outpatient Substance Use Counseling",
      verifiedByReportAuthor: true,
    },
    {
      id: "ptx-2",
      yearCompleted: 2019,
      programName: "Anger Management Program",
      verifiedByReportAuthor: false,
    },
  ],
  employmentHistories: [
    {
      id: "emp-1",
      employerName: "Sample Employer Inc.",
      startDate: new Date("2022-02-01T00:00:00.000Z"),
      endDate: new Date("2022-06-01T00:00:00.000Z"),
      verifiedByReportAuthor: false,
    },
  ],
  drugHistories: [
    {
      id: "drug-1",
      substance: "Methamphetamine",
      otherSubstanceName: null,
      ageOfRegularUse: 19,
      lastUse: new Date("2025-08-01T00:00:00.000Z"),
      heaviestUse: "Daily",
      method: "Smoking",
    },
    {
      id: "drug-2",
      substance: "Alcohol",
      otherSubstanceName: null,
      ageOfRegularUse: 16,
      lastUse: new Date("2025-10-01T00:00:00.000Z"),
      heaviestUse: "Occasionally",
      method: "Oral",
    },
  ],
} as unknown as SAR;

/**
 * Same as the populated variant, but with the officer signature applied while
 * the supervisor is left unsigned — exercises the signed and blank branches of
 * the signature block side by side.
 */
export const mockSARSigned: SAR = {
  ...mockSARPopulated,
  officerSignature: "Casey J Officer",
  officerTitle: "Probation & Parole Officer",
  officerLastSignedAt: new Date("2026-02-10T00:00:00.000Z"),
} as unknown as SAR;

/**
 * Declined-to-participate variant: the same populated data, but the defendant
 * declined. Exercises the declined guards — Historical Outcome, Defendant's
 * Version, and Key Considerations are hidden, and Recommendation shows the
 * fixed fallback line, even though the underlying fields are still populated.
 */
export const mockSARDeclined: SAR = {
  ...mockSARPopulated,
  defendantDeclinedToParticipate: true,
} as unknown as SAR;

/**
 * Skipped-sections variant: the same populated data, but Victim Impact,
 * Defendant's Version, Recommendation, and both Key Considerations sub-sections
 * are flagged skipped in metadata. Exercises the skip guards — those sections
 * are omitted entirely rather than rendering their (present) content.
 */
export const mockSARSkipped: SAR = {
  ...mockSARPopulated,
  metadata: {
    sections: {
      victimImpactStatement: { skipped: true },
      defendantStatement: { skipped: true },
      recommendation: { skipped: true },
      keyConsiderations: {
        areasOfNeed: { skipped: true },
        mitigatingFactors: { skipped: true },
      },
    },
  },
} as unknown as SAR;
