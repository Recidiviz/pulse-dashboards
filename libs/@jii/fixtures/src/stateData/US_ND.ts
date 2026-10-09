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

import { RawUsNdResidentJiiData } from "~@jii/schemas";
import {
  relativeFixtureDate,
  usNdResidentCommonDataFixtures,
} from "~datatypes";

export const usNdResidentJiiDataFixtures: RawUsNdResidentJiiData[] = [
  {
    ...usNdResidentCommonDataFixtures[0],
    lastUpdatedDate: relativeFixtureDate(),
  },
  {
    ...usNdResidentCommonDataFixtures[1],
    lastUpdatedDate: relativeFixtureDate(),
    initialReviewDate: relativeFixtureDate({ months: 2 }),
    goodTimeDate: relativeFixtureDate({ months: 7 }),
    finalSentExpDate: relativeFixtureDate({ months: 10 }),
  },
  {
    ...usNdResidentCommonDataFixtures[2],
    lastUpdatedDate: relativeFixtureDate(),
  },
];
