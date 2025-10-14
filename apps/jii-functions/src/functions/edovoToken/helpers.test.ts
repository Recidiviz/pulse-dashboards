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

import { edovoIdTokenPayloadSchema } from "./helpers";

describe("edovo payload schema", () => {
  test("Maine ID crosswalk", () => {
    const payload = {
      inmate_id: "00123456",
      facility_state: "ME",
    };
    expect(edovoIdTokenPayloadSchema.parse(payload)).toMatchInlineSnapshot(`
      {
        "facility_state": "US_ME",
        "inmate_id": "123456",
      }
    `);
  });

  test("Nebraska ID crosswalk", () => {
    const payload = {
      inmate_id: "00098765",
      facility_state: "NE",
    };
    expect(edovoIdTokenPayloadSchema.parse(payload)).toMatchInlineSnapshot(`
      {
        "facility_state": "US_NE",
        "inmate_id": "98765",
      }
    `);
  });
});
