// Recidiviz - a data platform for criminal justice reform
// Copyright (C) 2025 Recidiviz, Inc.
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

import moment from "moment";

import { SAR } from "../APIClient";

const birthDate = new Date("1990-01-01");
const age = moment().utc().diff(birthDate, "years");

export const SARDetailsFixture: { [sarId: string]: SAR } = {
  default: {
    id: "default",
    externalId: "SAR-123456",
    updatedAt: new Date(),
    defendantDeclinedToParticipate: false,
    mostSevereOffenseName: null,
    client: {
      externalId: "SAR-123456",
      fullName: "John Doe",
      firstName: "John",
      lastName: "Doe",
      gender: "MALE" as const,
      birthDate,
      raceOrEthnicity: ["White"],
      motherName: null,
      fatherName: null,
      guardianName: null,
      DOCTreatmentHistories: [],
    },
    staff: {
      externalId: "STAFF-001",
      pseudonymizedId: "STAFF-PSEUDO-001",
      fullName: "Jane Smith",
      email: "jane.smith@example.com",
      officeAddress: "123 Main St, Jefferson City, MO 65101",
      officePhoneNumber: "573-555-0100",
      district: { name: "District 1" },
    },
    age,
    charges: [
      {
        id: "charge-1",
        chargeExternalId: "CHARGE-001",

        offense: "Sample Offense",
        division: null,
        pleaAgreement: null,
        prosecutingAttorney: null,
        defenseAttorney: null,
        pleaDate: null,
        sentencingDate: null,
        classificationType: null,
        classificationSubtype: null,
        causeNum: null,
        moCode: null,
        judgeNames: [],
        county: null,
      },
    ],
    hasManuallyUpdatedEmploymentHistory: false,
    drugHistories: [],
    employmentHistories: [],
    priorTreatmentHistories: [],

    status: "InProgress",
    needsToBeAddressed: [],
    otherNeedToBeAddressed: null,
    mitigatingFactors: [],
    otherMitigatingFactor: null,
    dueDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
    courtDate: new Date(Date.now() + 45 * 24 * 60 * 60 * 1000),
    completionDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 2000),

    victimImpactStatement: null,
    requestingJudgeName: null,
    dateRequested: null,
    division: null,
    address: null,

    // Education / Assessment
    levelOfEducation: null,
    assessmentScore: 0,
    assessmentType: null,
    assessmentDate: null,
    assessmentAdministeredBy: null,
    ORASLastUpdatedAt: new Date("2026-01-01"),
    ORASEnteredManually: false,

    // Criminal History Levels
    criminalHistoryLevel: 0,
    educationLevelScore: 0,
    neighborhoodLevel: 0,
    substanceAbuseLevel: 0,
    familySocialSupportLevel: 0,
    peerAssociatesLevel: 0,
    criminalBehaviorLevel: 0,
    responsivityLevel: 0,
    criminalHistoryRiskLevel: null,
    educationRiskLevel: null,
    neighborhoodRiskLevel: null,
    substanceAbuseRiskLevel: null,
    familySocialSupportRiskLevel: null,
    peerAssociatesRiskLevel: null,
    criminalBehaviorRiskLevel: null,

    // Narrative fields
    defendantStatement: null,
    criminalHistorySummary: null,
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

    // Metadata
    metadata: {},

    // E-signatures
    officerSignature: null,
    officerTitle: null,
    officerLastSignedAt: null,
    supervisorSignature: null,
    supervisorTitle: null,
    supervisorLastSignedAt: null,
  },
};
