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

import { RawUsArResidentJiiData } from "~@jii/schemas";
import { usArResidentCommonDataFixtures } from "~datatypes";

export const usArResidentJiiDataFixtures: RawUsArResidentJiiData[] = [
  {
    ...usArResidentCommonDataFixtures[0],
    lastUpdatedDate: "2021-12-16",
  },
  {
    ...usArResidentCommonDataFixtures[1],
    lastUpdatedDate: "2021-12-16",
  },
  {
    ...usArResidentCommonDataFixtures[2],
    lastUpdatedDate: "2021-12-16",
  },
  {
    ...usArResidentCommonDataFixtures[3],
    lastUpdatedDate: "2021-12-16",
  },
  {
    ...usArResidentCommonDataFixtures[4],
    lastUpdatedDate: "2021-12-16",
  },
  {
    ...usArResidentCommonDataFixtures[5],
    cohortCode: "4",
    lastUpdatedDate: "2025-04-01",
  },
];
