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

import { relativeFixtureDate } from "../../../utils/zod/date/fixtureDates";
import { makeRecordFixture } from "../../../utils/zod/object/makeRecordFixture";
import { FixtureMapping } from "../../utils/types";
import {
  UsMiCustodyLevelDowngradeReferralRecord,
  usMiCustodyLevelDowngradeSchema,
} from "./schema";

export const usMiCustodyLevelDowngradeFixtures = {
  fullyEligible1: makeRecordFixture(usMiCustodyLevelDowngradeSchema, {
    stateCode: "US_MI",
    externalId: "RES019",
    eligibleCriteria: {
      usMiActualPlacementLevelLessThanCustodyLevel: {
        actualPlacementLevel: "I",
        custodyLevel: "CLOSE",
        custodyLevelStartDate: relativeFixtureDate({ months: 5 }),
        mostRecentAssessmentDate: relativeFixtureDate({ months: 4 }),
      },
    },
    ineligibleCriteria: {},
    metadata: {
      confinementLevel: "I",
      managementLevel: "I",
      managementLevelRawScore: 3,
      mostRecentAssessmentDate: relativeFixtureDate({ days: -30 }),
      noAssessmentSince26: true,
      tabName: "ELIGIBLE_FOR_MOVEMENT",
    },
    isEligible: true,
    isAlmostEligible: false,
  }),
  fullyEligible2: makeRecordFixture(usMiCustodyLevelDowngradeSchema, {
    stateCode: "US_MI",
    externalId: "RES020",
    eligibleCriteria: {
      usMiActualPlacementLevelLessThanCustodyLevel: {
        actualPlacementLevel: "I",
        custodyLevel: "CLOSE",
        custodyLevelStartDate: relativeFixtureDate({ months: 5 }),
        mostRecentAssessmentDate: relativeFixtureDate({ months: 4 }),
      },
    },
    ineligibleCriteria: {},
    metadata: {
      confinementLevel: "I",
      managementLevel: "I",
      managementLevelRawScore: 3,
      mostRecentAssessmentDate: relativeFixtureDate({ days: -30 }),
      noAssessmentSince26: true,
      tabName: "ELIGIBLE_FOR_MOVEMENT",
    },
    isEligible: true,
    isAlmostEligible: false,
  }),
  almostEligible1: makeRecordFixture(usMiCustodyLevelDowngradeSchema, {
    stateCode: "US_MI",
    externalId: "RES021",
    eligibleCriteria: {
      usMiManagementLevelLessThanOrEqualToCustodyLevel: {
        managementLevel: "II",
        custodyLevel: "RESTRICTIVE_MINIMUM",
      },
      usMiManagementLevelGreaterThanConfinementLevel: {
        confinementLevel: "I",
        managementLevel: "II",
      },
      usMiManagementLevelWithinSixPointsOfLowerLevel: {
        managementLevelRawScore: "10",
      },
      usMiNoClassIOrIiMisconductOrAssessmentAfterMisconduct: {
        firstAssessmentDateFollowingMisconduct: null,
        incarcerationStartDate: null,
        lastMisconductDate: null,
      },
    },
    ineligibleCriteria: {
      usMiNoClassIOrIiMisconductInSixMonthsAndNoSecurityAssessment: {
        assessedAfterSixMonthsMisconductFreeDate: 0,
        incarcerationStartDate: relativeFixtureDate({ years: -2 }),
        lastMisconductDate: null,
        mostRecentAssessmentDate: relativeFixtureDate({ days: -30 }),
        sixMonthMisconductFreeDate: relativeFixtureDate({ days: 7 }),
      },
    },
    metadata: {
      confinementLevel: "I",
      managementLevel: "I",
      managementLevelRawScore: null,
      mostRecentAssessmentDate: relativeFixtureDate({ days: -30 }),
      noAssessmentSince26: true,
      tabName: "ELIGIBLE_FOR_ASSESSMENT",
    },
    isEligible: false,
    isAlmostEligible: true,
  }),
} satisfies FixtureMapping<UsMiCustodyLevelDowngradeReferralRecord>;
