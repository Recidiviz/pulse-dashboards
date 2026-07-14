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
  UsTxAnnualReportStatusV2Record,
  usTxAnnualReportStatusV2Schema,
} from "./schema";

export const usTxAnnualReportStatusV2Fixtures = {
  eligible: makeRecordFixture(usTxAnnualReportStatusV2Schema, {
    stateCode: "US_TX",
    externalId: "ARS_V2_001",
    isEligible: true,
    isAlmostEligible: false,
    eligibleCriteria: {},
    ineligibleCriteria: {},
    formInformation: {
      tdcjNumber: "99001122",
      unitSupervisor: "DAVIS CAROL",
    },
    metadata: { grantedAt: null },
  }),
  grantApproved: makeRecordFixture(usTxAnnualReportStatusV2Schema, {
    stateCode: "US_TX",
    externalId: "ARS_V2_002",
    isEligible: true,
    isAlmostEligible: false,
    eligibleCriteria: {},
    ineligibleCriteria: {},
    formInformation: {
      tdcjNumber: "33445566",
      unitSupervisor: "MOORE ERIC",
      paroleSupervisor: "MARTIN LISA",
      assistantRegionDirector: "JACKSON FRED",
      regionDirector: "WHITE GINA",
    },
    metadata: { grantedAt: relativeFixtureDate({ days: -7 }) },
  }),
} satisfies FixtureMapping<UsTxAnnualReportStatusV2Record>;
