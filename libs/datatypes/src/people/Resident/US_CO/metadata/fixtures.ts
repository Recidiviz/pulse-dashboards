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
import { RawUsCoResidentCommon, RawUsCoResidentMetadata } from "./schema";

// Fields used by both JII and workflows products.
export const usCoResidentCommonDataFixtures: RawUsCoResidentCommon[] = [
  {
    stateCode: "US_CO",
    incarcerationStartDate: relativeFixtureDate({ years: -1, days: -97 }),
    pedTent: relativeFixtureDate({ years: 1, months: 3 }),
    mrdTent: relativeFixtureDate({ years: 2 }),
    cohortLabel: "STANDARD",
  },
  {
    stateCode: "US_CO",
    incarcerationStartDate: relativeFixtureDate({ years: -2, months: -6 }),
    pedTent: relativeFixtureDate({ months: 8 }),
    mrdTent: relativeFixtureDate({ years: 1, months: 6 }),
    cohortLabel: "LIFE_WITHOUT_PAROLE",
  },
];

// Workflows metadata (extends common). The workflows-only fields are
// optional and not exercised by these fixtures.
export const usCoResidentMetadataFixtures: Array<RawUsCoResidentMetadata> = [
  ...usCoResidentCommonDataFixtures,
];
