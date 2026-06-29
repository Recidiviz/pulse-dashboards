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
import {
  UsIdCustodyLevelDowngradeRecord,
  usIdCustodyLevelDowngradeSchema,
} from "./schema";

export const usIdCustodyLevelDowngradeFixtures = {
  eligible: makeRecordFixture(usIdCustodyLevelDowngradeSchema, {
    stateCode: "US_ID",
    externalId: "ID_RES001",
    eligibleCriteria: {
      custodyLevelHigherThanRecommended: {
        custodyLevel: "MEDIUM",
        recommendedCustodyLevel: "MINIMUM",
        upcomingEligibilityDate: relativeFixtureDate({ months: -1 }),
      },
    },
    ineligibleCriteria: {},
    isEligible: true,
    isAlmostEligible: false,
    metadata: {
      eligibleDate: relativeFixtureDate({ months: -1 }),
    },
  }),
} satisfies FixtureMapping<UsIdCustodyLevelDowngradeRecord>;
