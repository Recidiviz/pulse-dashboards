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

import { relativeFixtureDate } from "../../../utils/zod";
import { makeRecordFixture } from "../../../utils/zod";
import { FixtureMapping } from "../../utils/types";
import {
  UsTnSuspensionOfDirectSupervisionRecord,
  usTnSuspensionOfDirectSupervisionSchema,
} from "./schema";

export const usTnSuspensionOfDirectSupervisionFixtures = {
  eligible: makeRecordFixture(usTnSuspensionOfDirectSupervisionSchema, {
    stateCode: "US_TN",
    externalId: "101",
    eligibleCriteria: {},
    ineligibleCriteria: {},
    formInformation: {
      convictionCounties: ["123 - ABC"],
      convictionCharge: "THEFT OF PROPERTY",
      sentenceDate: relativeFixtureDate({ years: -3 }),
      supervisionDuration: "5 years",
      supervisionOfficeLocation: "Nashville",
    },
    metadata: {
      latestNegativeArrestCheck: {
        contactDate: relativeFixtureDate({ days: -30 }),
        contactType: "ARRN",
      },
    },
    isEligible: true,
    isAlmostEligible: false,
  }),
} satisfies FixtureMapping<UsTnSuspensionOfDirectSupervisionRecord>;
