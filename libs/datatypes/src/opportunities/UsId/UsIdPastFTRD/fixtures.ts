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
import { UsIdPastFTRDRecord, usIdPastFTRDSchema } from "./schema";

export const usIdPastFTRDFixtures = {
  eligible: makeRecordFixture(usIdPastFTRDSchema, {
    stateCode: "US_ID",
    externalId: "002",
    eligibleCriteria: {
      supervisionPastFullTermCompletionDate: {
        eligibleDate: relativeFixtureDate({ months: -1 }),
      },
    },
    ineligibleCriteria: {},
    metadata: { tabName: "ELIGIBLE" },
    isEligible: true,
    isAlmostEligible: false,
  }),
  almostEligible: makeRecordFixture(usIdPastFTRDSchema, {
    stateCode: "US_ID",
    externalId: "010",
    eligibleCriteria: {},
    ineligibleCriteria: {
      supervisionPastFullTermCompletionDate: {
        eligibleDate: relativeFixtureDate({ months: 2 }),
      },
    },
    metadata: { tabName: "ALMOST_ELIGIBLE" },
    isEligible: false,
    isAlmostEligible: true,
  }),
} satisfies FixtureMapping<UsIdPastFTRDRecord>;
