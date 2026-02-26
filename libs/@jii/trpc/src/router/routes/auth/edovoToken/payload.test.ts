// Recidiviz - a data platform for criminal justice reform
// Copyright (C) 2025 Recidiviz, Inc.
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

import { stateCodes } from "~@jii/configs";

import { edovoIdTokenPayloadSchema } from "./payload";

test.each([
  ...stateCodes.options,
  // official support for ME was removed due to outdated legacy features,
  // but we still have some edovo integration code that we want to keep around
  "US_ME",
] as const)("edovo payload schema for %s", (stateCode) => {
  let incomingId = "1234";
  let expectedId = "1234";
  switch (stateCode) {
    case "US_NE":
    case "US_ME":
      incomingId = "00000" + incomingId;
      break;
    case "US_CO":
      // CO specifically has a 6 digit limit
      expectedId = "001234";
      break;
    default:
      break;
  }

  expect(
    edovoIdTokenPayloadSchema.parse({
      inmate_id: incomingId,
      // edovo payloads don't have the US_ prefix
      facility_state: stateCode.substring(3),
    }),
  ).toEqual({
    facility_state: stateCode,
    inmate_id: expectedId,
  });
});
