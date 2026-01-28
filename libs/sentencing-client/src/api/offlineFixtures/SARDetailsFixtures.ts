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
    defendantDeclinedToParticipate: false,
    client: {
      externalId: "SAR-123456",
      fullName: "John Doe",
      firstName: "John",
      lastName: "Doe",
      gender: "MALE" as const,
      birthDate,
      raceOrEthnicity: "White",
      ssn: null,
      motherName: null,
      fatherName: null,
      guardianName: null,
    },
    age,
    charges: [
      {
        id: "charge-1",
        offense: "Sample Offense",
        offenseId: "offense-1",
        division: null,
        pleaAgreement: null,
        prosecutingAttorney: null,
        defenseAttorney: null,
        pleaDate: null,
        sentencingDate: null,
        felonyClass: null,
        causeNum: null,
        moCode: null,
        judgeName: null,
        county: null,
      },
    ],
    drugHistories: [],
    employmentHistories: [],

    status: "InProgress",
    needsToBeAddressed: [],
    otherNeedToBeAddressed: null,
    mitigatingFactors: [],
    otherMitigatingFactor: null,
    dueDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),

    victimImpactStatement: null,
    requestingJudgeName: null,
    dateRequested: null,
    dateDueToCourt: null,
    division: null,
    address: null,

    // Education / Assessment
    levelOfEducation: null,
    assessmentScore: 0,
    assessmentType: null,
    assessmentDate: null,
    assessmentAdministeredBy: null,

    // Criminal History Levels
    criminalHistoryLevel: 0,
    educationLevelScore: 0,
    neighborhoodLevel: 0,
    substanceAbuseLevel: 0,
    familySocialSupportLevel: 0,
    peerAssociatesLevel: 0,
    criminalBehaviorLevel: 0,
    responsivityLevel: 0,

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

    // Metadata
    metadata: {},
  },
};
