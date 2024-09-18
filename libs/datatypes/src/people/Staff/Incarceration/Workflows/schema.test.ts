// Recidiviz - a data platform for criminal justice reform
// Copyright (C) 2024 Recidiviz, Inc.
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

import { incarcerationStaffFixtures } from "./fixture";
import { incarcerationStaffRecordSchema } from "./schema";

test.each(incarcerationStaffFixtures.map((f) => f.input))(
  "incarceration staff schema for $stateCode $id",
  (input) => {
    expect(incarcerationStaffRecordSchema.parse(input)).toMatchSnapshot();
  },
);

test.each([{ type: "incarceration", schema: incarcerationStaffRecordSchema }])(
  "$type schema adds inferred properties when parsing input",
  ({ type, schema }) => {
    expect(
      schema.parse({
        id: "test123",
        stateCode: "US_XX",
        givenNames: "Test",
        surname: "Person",
        pseudonymizedId: "anon123",
      }),
    ).toHaveProperty("recordType", `${type}Staff`);
  },
);
