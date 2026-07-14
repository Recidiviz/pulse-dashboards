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

import { makeRecordFixture } from "../../../utils/zod";
import { FixtureMapping } from "../../utils/types";
import {
  UsTxEarlyReleaseFromSupervisionRecord,
  usTxEarlyReleaseFromSupervisionSchema,
} from "./schema";

export const usTxEarlyReleaseFromSupervisionFixtures = {
  eligible: makeRecordFixture(usTxEarlyReleaseFromSupervisionSchema, {
    stateCode: "US_TX",
    externalId: "ERS001",
    isEligible: true,
    isAlmostEligible: false,
    eligibleCriteria: {},
    ineligibleCriteria: {},
    formInformation: {
      tdcjNumber: "12345678",
      unitSupervisor: "SMITH JOHN",
      paroleSupervisor: "DOE JANE",
    },
  }),
  eligibleNoFormInfo: makeRecordFixture(usTxEarlyReleaseFromSupervisionSchema, {
    stateCode: "US_TX",
    externalId: "ERS002",
    isEligible: true,
    isAlmostEligible: false,
    eligibleCriteria: {},
    ineligibleCriteria: {},
    formInformation: {},
  }),
} satisfies FixtureMapping<UsTxEarlyReleaseFromSupervisionRecord>;
