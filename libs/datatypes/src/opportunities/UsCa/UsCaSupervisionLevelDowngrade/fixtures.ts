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
  UsCaSupervisionLevelDowngradeRecord,
  usCaSupervisionLevelDowngradeSchema,
} from "./schema";

export const usCaSupervisionLevelDowngradeFixtures = {
  fullyEligible: makeRecordFixture(usCaSupervisionLevelDowngradeSchema, {
    stateCode: "US_CA",
    externalId: "CLIENT001",
    isEligible: true,
    isAlmostEligible: false,
    formInformation: {
      cdcno: "WF1234",
    },
    eligibleCriteria: {
      noSupervisionViolationWithin6Months: null,
      supervisionLevelIsHighFor6Months: {
        highStartDate: relativeFixtureDate({ months: -8 }),
      },
      usCaAssessmentLevel3OrLower: {},
      usCaHousingTypeIsNotTransient: {},
    },
    ineligibleCriteria: {},
  }),
  almostEligible: makeRecordFixture(usCaSupervisionLevelDowngradeSchema, {
    stateCode: "US_CA",
    externalId: "CLIENT002",
    isEligible: false,
    isAlmostEligible: true,
    formInformation: {
      cdcno: "AB1234",
    },
    eligibleCriteria: {
      supervisionLevelIsHighFor6Months: {
        highStartDate: relativeFixtureDate({ months: -8 }),
      },
      usCaAssessmentLevel3OrLower: {},
      usCaHousingTypeIsNotTransient: {},
    },
    ineligibleCriteria: {
      noSupervisionViolationWithin6Months: null,
    },
  }),
} satisfies FixtureMapping<UsCaSupervisionLevelDowngradeRecord>;
