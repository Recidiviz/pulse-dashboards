// Recidiviz - a data platform for criminal justice reform
// Copyright (C) 2024 Recidiviz, Inc.
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

import { Case } from "../APIClient";

export const CaseDetailsFixture: { [caseId: string]: Case } = {
  "f9c7ad42-949c-4f11-9ece-caf66df9f913": {
    id: "f9c7ad42-949c-4f11-9ece-caf66df9f913",
    externalId: "198374019",
    stateCode: "US_ID",
    dueDate: new Date("2025-01-19T13:52:20.338Z"),
    completionDate: new Date("2025-02-22T08:00:12.071Z"),
    sentenceDate: new Date("2023-12-16T04:52:18.339Z"),
    assignedDate: new Date("2023-10-20T20:19:13.149Z"),
    county: "Borders",
    lsirScore: null,
    lsirLevel: "6584455049248768",
    reportType: "Full PSI",
    offense: "Felony",
    previouslyIncarceratedOrUnderSupervision: false,
    hasPreviousFelonyConviction: true,
    hasPreviousViolentOffenseConviction: false,
    hasPreviousSexOffenseConviction: false,
    previousTreatmentCourt: null,
    hasPreviousTreatmentCourt: null,
    substanceUseDisorderDiagnosis: "None",
    asamCareRecommendation: null,
    mentalHealthDiagnoses: [],
    otherMentalHealthDiagnosis: null,
    hasDevelopmentalDisability: false,
    isVeteran: false,
    plea: "NotGuilty",
    hasOpenChildProtectiveServicesCase: false,
    needsToBeAddressed: [],
    otherNeedToBeAddressed: null,
    status: "InProgress",
    selectedRecommendation: null,
    recommendedOpportunities: [],
    isLsirScoreLocked: false,
    currentOnboardingTopic: "OffenseLsirScore",
    Client: {
      fullName: "Blanda Furman",
      gender: "EXTERNAL_UNKNOWN",
      county: "Gwynedd County",
      birthDate: new Date("1990-11-13T21:37:16.551Z"),
    },
    insight: {
      stateCode: "US_ID",
      gender: "MALE",
      offense: "Burglary",
      assessmentScoreBucketStart: 0,
      assessmentScoreBucketEnd: 20,
      rollupStateCode: "US_ID",
      rollupGender: null,
      rollupAssessmentScoreBucketStart: null,
      rollupAssessmentScoreBucketEnd: null,
      rollupOffense: "Burglary",
      rollupNcicCategory: null,
      rollupCombinedOffenseCategory: null,
      rollupViolentOffense: null,
      rollupRecidivismNumRecords: 100,
      // TOOD(https://github.com/Recidiviz/recidiviz-data/issues/30951): Use sampled real data for this
      rollupRecidivismSeries: [
        {
          recommendationType: "Probation",
          dataPoints: [
            {
              cohortMonths: 0,
              eventRate: 0,
              lowerCI: 0,
              upperCI: 0,
            },
            {
              cohortMonths: 3,
              eventRate: 0.02,
              lowerCI: 0.01,
              upperCI: 0.023,
            },
            {
              cohortMonths: 6,
              eventRate: 0.04,
              lowerCI: 0.035,
              upperCI: 0.045,
            },
            {
              cohortMonths: 9,
              eventRate: 0.07,
              lowerCI: 0.065,
              upperCI: 0.08,
            },
            {
              cohortMonths: 12,
              eventRate: 0.1,
              lowerCI: 0.09,
              upperCI: 0.11,
            },
            {
              cohortMonths: 18,
              eventRate: 0.13,
              lowerCI: 0.12,
              upperCI: 0.13,
            },
            {
              cohortMonths: 24,
              eventRate: 0.2,
              lowerCI: 0.19,
              upperCI: 0.21,
            },
            {
              cohortMonths: 30,
              eventRate: 0.22,
              lowerCI: 0.21,
              upperCI: 0.23,
            },
            {
              cohortMonths: 36,
              eventRate: 0.22,
              lowerCI: 0.21,
              upperCI: 0.23,
            },
          ],
        },
      ],
      dispositionNumRecords: 100,
      dispositionData: [
        {
          recommendationType: "Probation",
          percentage: 0.2,
        },
        {
          recommendationType: "Rider",
          percentage: 0.5,
        },
        {
          recommendationType: "Term",
          percentage: 0.3,
        },
      ],
    },
  },
};
