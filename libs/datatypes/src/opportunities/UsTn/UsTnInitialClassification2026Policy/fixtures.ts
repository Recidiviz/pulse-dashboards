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

import { makeRecordFixture } from "../../../utils/zod";
import { FixtureMapping } from "../../utils/types";
import {
  UsTnInitialClassification2026ReferralRecord,
  usTnInitialClassification2026Schema,
} from "./schema";

export const usTnInitialClassification2026PolicyFixtures = {
  fullyEligible: makeRecordFixture(usTnInitialClassification2026Schema, {
    stateCode: "US_TN",
    externalId: "RES003",
    isEligible: true,
    isAlmostEligible: false,
    eligibleCriteria: {
      custodyLevelIsNotMax: null,
      notHasInitialClassificationInStatePrisonCustody: null,
    },
    ineligibleCriteria: {},
    formInformation: {
      q1Score: 2,
      q2Score: 10,
      q3Score: -3,
      q4Score: 2,
      q5Score: -1,
      q6Score: 0,
      q1Notes: {
        listPriorNonTdocConvictions60Months: [
          {
            description: "some offense",
            imposedDate: "2022-12-01",
          },
        ],
        listPriorViolentTdocConvictions60Months: [
          {
            description: "some other offense",
            imposedDate: "2021-08-22",
          },
        ],
      },
      q2Notes: ["a third offense"],
      q3Notes: [
        {
          numIncidents: 1,
          incidentTimePeriod: "0-60Months",
          incidents: [
            {
              incidentDate: "2023-01-08",
              incidentTypeCode: "ABC",
            },
          ],
        },
      ],
      trusteeHas10YearsOrLessRemaining: true,
      trusteeNoAssaultiveDisciplinaryWithSeriousInjuryLast5Years: true,
      trusteeNoEscapeFromLowTrusteePast5Years: false,
      trusteeNoEscapeFromMediumCloseMaxPast10Years: true,
      trusteeNoViolentFelonyConvictionPast5YearsIncarceration: true,
      trusteeNotConvictedOfFirstDegreeMurder: true,
      trusteeNotConvictedOfViolentOffenseOr12MonthsInCustody: true,
      trusteeNotScoredHighForViolence: false,
      trusteeNotServingForSexualOffense: true,
      activeRecommendations: [{ Recommendation: "do this thing" }],
      hasIncompatibles: true,
      incompatibleArray: [
        { incompatibleOffenderId: "123", incompatibleType: "magentism" },
        { incompatibleOffenderId: "456", incompatibleType: "psychic" },
      ],
      statusAtHearingSeg: "GEN",
    },
  }),
  ineligible: makeRecordFixture(usTnInitialClassification2026Schema, {
    stateCode: "US_TN",
    externalId: "RES003",
    isEligible: false,
    isAlmostEligible: false,
    eligibleCriteria: {},
    ineligibleCriteria: {
      custodyLevelIsNotMax: {
        custodyLevel: "Maximum",
      },
      notHasInitialClassificationInStatePrisonCustody: {
        initialAssessmentDate: "2024-12-28",
        initialClassificationDate: "2025-01-01",
        initialClassificationDecisionDate: "2025-01-01",
      },
    },
    formInformation: {
      q1Score: 2,
      q2Score: 10,
      q3Score: -3,
      q4Score: 2,
      q5Score: -1,
      q6Score: 0,
      q1Notes: {
        listPriorNonTdocConvictions60Months: [
          {
            description: "some offense",
            imposedDate: "2022-12-01",
          },
        ],
        listPriorViolentTdocConvictions60Months: [
          {
            description: "some other offense",
            imposedDate: "2021-08-22",
          },
        ],
      },
      q2Notes: ["a third offense", "a fourth offense"],
      q3Notes: [
        {
          numIncidents: 2,
          incidentTimePeriod: "0-60Months",
          incidents: [
            {
              incidentDate: "2023-01-08",
              incidentTypeCode: "ABC",
            },
            {
              incidentDate: "2022-02-11",
              incidentTypeCode: "XYZ",
            },
          ],
        },
      ],
      q4Notes: [
        {
          numIncidents: 1,
          incidentTimePeriod: "0-60Months",
          incidents: [
            {
              incidentDate: "2023-01-08",
              incidentTypeCode: "DEF",
            },
          ],
        },
      ],
      q5Notes: [
        {
          numIncidents: 1,
          incidentTimePeriod: "0-60Months",
          incidents: [
            {
              incidentDate: "2023-01-08",
              incidentTypeCode: "HIJ",
            },
          ],
        },
      ],
      trusteeHas10YearsOrLessRemaining: true,
      trusteeNoAssaultiveDisciplinaryWithSeriousInjuryLast5Years: true,
      trusteeNoEscapeFromLowTrusteePast5Years: true,
      trusteeNoEscapeFromMediumCloseMaxPast10Years: true,
      trusteeNoViolentFelonyConvictionPast5YearsIncarceration: true,
      trusteeNotConvictedOfFirstDegreeMurder: true,
      trusteeNotConvictedOfViolentOffenseOr12MonthsInCustody: true,
      trusteeNotScoredHighForViolence: true,
      trusteeNotServingForSexualOffense: true,
      activeRecommendations: [],
      hasIncompatibles: false,
      incompatibleArray: [],
      statusAtHearingSeg: "GEN",
    },
  }),
} satisfies FixtureMapping<UsTnInitialClassification2026ReferralRecord>;
