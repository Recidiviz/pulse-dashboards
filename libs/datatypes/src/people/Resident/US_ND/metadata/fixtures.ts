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

import { relativeFixtureDate } from "../../../../utils/zod";
import { RawUsNdResidentCommon, RawUsNdResidentMetadata } from "./schema";

// Fields used by both JII and workflows products.
export const usNdResidentCommonDataFixtures: RawUsNdResidentCommon[] = [
  // res003: no sentence dates
  {
    stateCode: "US_ND",
  },
  // res004: full sentence dates
  {
    stateCode: "US_ND",
    paroleReviewDate: relativeFixtureDate({ months: 4 }),
    eightyFivePercentDate: relativeFixtureDate({ months: 5, days: 14 }),
  },
  // res005: parole review date only
  {
    stateCode: "US_ND",
    paroleReviewDate: relativeFixtureDate({ months: 10 }),
  },
];

// the only Workflows-only fields are optional and missing from these fixtures
export const usNdResidentMetadataFixtures: Array<RawUsNdResidentMetadata> = [
  ...usNdResidentCommonDataFixtures,
];
