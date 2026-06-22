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
import { UsAzReleaseToDTPRecord, usAzReleaseToDTPSchema } from "./schema";

export const usAzReleaseToDTPFixtures = {
  fullyEligible: makeRecordFixture(usAzReleaseToDTPSchema, {
    stateCode: "US_AZ",
    externalId: "RES001",
    isEligible: true,
    isAlmostEligible: false,
    eligibleCriteria: {
      usAzIncarcerationWithin6MonthsOfAcisDtpDate: {
        acisDtpDate: relativeFixtureDate({ months: 3 }),
      },
    },
    ineligibleCriteria: {},
    metadata: { tabDescription: "FAST_TRACK" },
  }),
  almostEligible: makeRecordFixture(usAzReleaseToDTPSchema, {
    stateCode: "US_AZ",
    externalId: "RES002",
    isEligible: false,
    isAlmostEligible: true,
    eligibleCriteria: {},
    ineligibleCriteria: {
      usAzWithin7DaysOfRecidivizDtpDate: {
        recidivizDtpDate: relativeFixtureDate({ days: 5 }),
      },
    },
    metadata: { tabName: "ALMOST_ELIGIBLE_1" },
  }),
} satisfies FixtureMapping<UsAzReleaseToDTPRecord>;
