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

import moment from "moment";

import { Case } from "../APIClient";

const birthDate = new Date("1990-11-13T21:37:16.551Z");
const age = moment().diff(birthDate, "years");

export const CaseDetailsFixture: { [caseId: string]: Case } = {
  "f9c7ad42-949c-4f11-9ece-caf66df9f913": {
    id: "f9c7ad42-949c-4f11-9ece-caf66df9f913",
    externalId: "198374019",
    stateCode: "US_ID",
    dueDate: new Date("2025-01-19T13:52:20.338Z"),
    completionDate: new Date("2025-02-22T08:00:12.071Z"),
    sentenceDate: new Date("2023-12-16T04:52:18.339Z"),
    assignedDate: new Date("2023-10-20T20:19:13.149Z"),
    age: age,
    county: "Borders",
    lsirScore: null,
    lsirLevel: "6584455049248768",
    reportType: "FullPSI",
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
    recommendationSummary: null,
    isReportTypeLocked: false,
    client: {
      fullName: "Blanda Furman",
      firstName: "Blanda",
      lastName: "Furman",
      gender: "EXTERNAL_UNKNOWN",
      county: "Gwynedd County",
      birthDate: birthDate,
      externalId: "70478174",
      isGenderLocked: false,
      district: "DISTRICT 1",
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
      rollupRecidivismSeries: [
        {
          recommendationType: "Probation",
          dataPoints: [
            {
              cohortMonths: 0,
              eventRate: 0.0,
              lowerCI: 0.0,
              upperCI: 0.0016359792124440663,
            },
            {
              cohortMonths: 3,
              eventRate: 0.001775410563692854,
              lowerCI: 0.0004839448361592515,
              upperCI: 0.0045394628394267444,
            },
            {
              cohortMonths: 6,
              eventRate: 0.007989347536617843,
              lowerCI: 0.004741667732398544,
              upperCI: 0.012597327442728819,
            },
            {
              cohortMonths: 9,
              eventRate: 0.014647137150466045,
              lowerCI: 0.010103297834739247,
              upperCI: 0.02050901673745881,
            },
            {
              cohortMonths: 12,
              eventRate: 0.024855747891699954,
              lowerCI: 0.018829121129335526,
              upperCI: 0.032157058793253084,
            },
            {
              cohortMonths: 18,
              eventRate: 0.047936085219707054,
              lowerCI: 0.039485994868523555,
              upperCI: 0.05758508255803222,
            },
            {
              cohortMonths: 24,
              eventRate: 0.06435863293386596,
              lowerCI: 0.05457587203352398,
              upperCI: 0.07529205759117891,
            },
            {
              cohortMonths: 30,
              eventRate: 0.0954283177984909,
              lowerCI: 0.08360658230419535,
              upperCI: 0.10831380115197156,
            },
            {
              cohortMonths: 36,
              eventRate: 0.11540168664003551,
              lowerCI: 0.1024932104809297,
              upperCI: 0.12931950739680265,
            },
          ],
        },
        {
          recommendationType: "Rider",
          dataPoints: [
            {
              cohortMonths: 0,
              eventRate: 0.0,
              lowerCI: 0.0,
              upperCI: 0.015252810401278717,
            },
            {
              cohortMonths: 3,
              eventRate: 0.025,
              lowerCI: 0.009228601454783299,
              upperCI: 0.05361747542837168,
            },
            {
              cohortMonths: 6,
              eventRate: 0.041666666666666664,
              lowerCI: 0.020158798678605903,
              upperCI: 0.07528970452966509,
            },
            {
              cohortMonths: 9,
              eventRate: 0.09166666666666666,
              lowerCI: 0.058340998102745956,
              upperCI: 0.13549387552856768,
            },
            {
              cohortMonths: 12,
              eventRate: 0.125,
              lowerCI: 0.08594955537609393,
              upperCI: 0.17361491787383912,
            },
            {
              cohortMonths: 18,
              eventRate: 0.175,
              lowerCI: 0.12913117449749056,
              upperCI: 0.2290958627870909,
            },
            {
              cohortMonths: 24,
              eventRate: 0.2125,
              lowerCI: 0.16250464164114387,
              upperCI: 0.26974660737269246,
            },
            {
              cohortMonths: 30,
              eventRate: 0.2375,
              lowerCI: 0.18512301259071262,
              upperCI: 0.296485408880243,
            },
            {
              cohortMonths: 36,
              eventRate: 0.2798333333333333,
              lowerCI: 0.21567445381410313,
              upperCI: 0.33175014905409017,
            },
          ],
        },
        {
          recommendationType: "Term",
          dataPoints: [
            {
              cohortMonths: 0,
              eventRate: 0.0,
              lowerCI: 0.0,
              upperCI: 0.011183577302541721,
            },
            {
              cohortMonths: 3,
              eventRate: 0.018292682926829267,
              lowerCI: 0.0067419449093237376,
              upperCI: 0.039388290517139705,
            },
            {
              cohortMonths: 6,
              eventRate: 0.03048780487804878,
              lowerCI: 0.014714958259960302,
              upperCI: 0.0553520859627306,
            },
            {
              cohortMonths: 9,
              eventRate: 0.039634146341463415,
              lowerCI: 0.021269461741115027,
              upperCI: 0.06682204399508536,
            },
            {
              cohortMonths: 12,
              eventRate: 0.06097560975609756,
              lowerCI: 0.037639701036202344,
              upperCI: 0.09260337341650224,
            },
            {
              cohortMonths: 18,
              eventRate: 0.09451219512195122,
              lowerCI: 0.06512227678916212,
              upperCI: 0.1314673855562929,
            },
            {
              cohortMonths: 24,
              eventRate: 0.14329268292682926,
              lowerCI: 0.10453975725601933,
              upperCI: 0.18260053471381693,
            },
            {
              cohortMonths: 30,
              eventRate: 0.20426829268292682,
              lowerCI: 0.16195676226355682,
              upperCI: 0.2520116394130336,
            },
            {
              cohortMonths: 36,
              eventRate: 0.267,
              lowerCI: 0.1759044241832965,
              upperCI: 0.2682661391131417,
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
