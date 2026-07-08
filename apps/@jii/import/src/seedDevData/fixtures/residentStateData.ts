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

import {
  rawUsCoResidentJiiDataFixtures,
  rawUsMaResidentJiiDataFixtures,
  usArResidentJiiDataFixtures,
  usAzResidentJiiDataFixtures,
  usNcResidentJiiFixtures,
  usNdResidentJiiDataFixtures,
  usNeResidentJiiDataFixtures,
  usTnResidentCommon,
  usTnResidentJiiDataFixture,
} from "~datatypes";

// the value type is not important here because it's being fed directly to a Zod parser,
// but TS can't infer anything sensible from the different arrays and causes errors
export const rawResidentStateDataFixtures = new Map<string, Array<unknown>>([
  // TODO(OBT-29535): move these over from datatypes
  ["US_AR", usArResidentJiiDataFixtures],
  ["US_AZ", usAzResidentJiiDataFixtures],
  ["US_CO", rawUsCoResidentJiiDataFixtures],
  ["US_MA", rawUsMaResidentJiiDataFixtures],
  ["US_NC", usNcResidentJiiFixtures],
  ["US_ND", usNdResidentJiiDataFixtures],
  ["US_NE", usNeResidentJiiDataFixtures],
  // all records here share the same fixture
  ["US_TN", usTnResidentCommon.map(() => usTnResidentJiiDataFixture)],
]);
