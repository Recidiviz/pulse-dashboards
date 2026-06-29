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

import { makeRecordFixture, relativeFixtureDate } from "../../../utils/zod";
import { FixtureMapping } from "../../utils/types";
import { UsIdEarnedDischargeRecord, usIdEarnedDischargeSchema } from "./schema";

export const usIdEarnedDischargeFixtures = {
  dualParoleRecord: makeRecordFixture(usIdEarnedDischargeSchema, {
    stateCode: "US_ID",
    externalId: "001",
    formInformation: {},
    eligibleCriteria: {
      usIdLsirLevelLowModerateForXDays: {
        riskLevel: "MODERATE",
        eligibleDate: relativeFixtureDate({ months: -3 }),
      },
      noFelonyWithin24Months: null,
      usIdParoleDualSupervisionPastEarlyDischargeDate: {
        eligibleDate: relativeFixtureDate({ months: -1 }),
        sentenceType: "DUAL",
      },
    },
    ineligibleCriteria: {},
    eligibleStartDate: relativeFixtureDate({ months: -6 }),
    isEligible: true,
    isAlmostEligible: false,
  }),
  almostEligibleSupervisionLength: makeRecordFixture(
    usIdEarnedDischargeSchema,
    {
      stateCode: "US_ID",
      externalId: "002",
      formInformation: {},
      eligibleCriteria: {
        usIdLsirLevelLowModerateForXDays: {
          riskLevel: "MODERATE",
          eligibleDate: relativeFixtureDate({ months: -3 }),
        },
        noFelonyWithin24Months: null,
      },
      ineligibleCriteria: {
        onProbationAtLeastOneYear: {
          eligibleDate: relativeFixtureDate({ months: 3 }),
        },
      },
      eligibleStartDate: relativeFixtureDate({ months: -4 }),
      isEligible: false,
      isAlmostEligible: true,
    },
  ),
  probationEligible: makeRecordFixture(usIdEarnedDischargeSchema, {
    stateCode: "US_ID",
    externalId: "003",
    formInformation: {},
    eligibleCriteria: {
      usIdLsirLevelLowModerateForXDays: {
        riskLevel: "MODERATE",
        eligibleDate: relativeFixtureDate({ months: -3 }),
      },
      noFelonyWithin24Months: null,
      supervisionNotPastFullTermCompletionDate: {
        eligibleDate: relativeFixtureDate({ years: 2 }),
      },
      onProbationAtLeastOneYear: {
        eligibleDate: relativeFixtureDate({ months: -1 }),
      },
    },
    ineligibleCriteria: {},
    eligibleStartDate: relativeFixtureDate({ months: -6 }),
    isEligible: true,
    isAlmostEligible: false,
  }),
  optionalCriteriaHaveSaneFallbacks: makeRecordFixture(
    usIdEarnedDischargeSchema,
    {
      stateCode: "US_ID",
      externalId: "004",
      formInformation: {},
      eligibleCriteria: {
        usIdLsirLevelLowModerateForXDays: {
          riskLevel: "MODERATE",
          eligibleDate: relativeFixtureDate({ months: -3 }),
        },
        noFelonyWithin24Months: null,
        supervisionNotPastFullTermCompletionDate: {
          eligibleDate: relativeFixtureDate({ years: 2 }),
        },
        onProbationAtLeastOneYear: {
          eligibleDate: relativeFixtureDate({ months: -1 }),
        },
      },
      ineligibleCriteria: {},
      eligibleStartDate: relativeFixtureDate({ months: -6 }),
      isEligible: true,
      isAlmostEligible: false,
    },
  ),
  complexFormInformation: makeRecordFixture(usIdEarnedDischargeSchema, {
    stateCode: "US_ID",
    externalId: "005",
    formInformation: {
      ncicCheckDate: relativeFixtureDate({ months: -1 }),
      chargeDescriptions: ["Shoplifting", "Public Intoxication", "Trespassing"],
      fullTermReleaseDates: [
        relativeFixtureDate({ months: 14 }),
        relativeFixtureDate({ months: 13 }),
        relativeFixtureDate({ months: 12 }),
      ],
      judgeNames: [
        '{"givenNames": "Starla", "surname": "Murieta"}',
        '{"givenNames": "Raymond", "surname": "Dart"}',
        '{"givenNames": "Ahmud", "surname": "Blake"}',
      ],
      countyNames: ["Duane", "Duane", "Moraga"],
      sentenceMax: ["365", "334", "60"],
      sentenceMin: ["92", "61", "15"],
      caseNumbers: ["12858", "13085", "14558"],
      dateImposed: [
        relativeFixtureDate({ months: -40 }),
        relativeFixtureDate({ months: -38 }),
        relativeFixtureDate({ months: -36 }),
      ],
      firstAssessmentScore: "27",
      firstAssessmentDate: relativeFixtureDate({ months: -24 }),
      latestAssessmentScore: "19",
      latestAssessmentDate: relativeFixtureDate({ months: -2 }),
    },
    eligibleCriteria: {
      usIdLsirLevelLowModerateForXDays: {
        riskLevel: "MODERATE",
        eligibleDate: relativeFixtureDate({ months: -3 }),
      },
      noFelonyWithin24Months: null,
      supervisionNotPastFullTermCompletionDate: {
        eligibleDate: relativeFixtureDate({ years: 2 }),
      },
      onProbationAtLeastOneYear: {
        eligibleDate: relativeFixtureDate({ months: -1 }),
      },
    },
    ineligibleCriteria: {},
    eligibleStartDate: relativeFixtureDate({ months: -6 }),
    isEligible: true,
    isAlmostEligible: false,
  }),
} satisfies FixtureMapping<UsIdEarnedDischargeRecord>;
