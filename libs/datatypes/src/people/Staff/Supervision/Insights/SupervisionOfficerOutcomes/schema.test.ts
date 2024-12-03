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

import { rawSupervisionOfficerOutcomesFixture } from "./fixture";
import { supervisionOfficerOutcomesSchema } from "./schema";

test("transformations", () => {
  rawSupervisionOfficerOutcomesFixture.forEach((b) =>
    expect(supervisionOfficerOutcomesSchema.parse(b)).toMatchSnapshot(),
  );
});

test("missing caseload category fails parsing", () => {
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  const { caseloadCategory, ...rawFixtureNoCaseloadCategory } =
    rawSupervisionOfficerOutcomesFixture[0];

  expect(() =>
    supervisionOfficerOutcomesSchema.parse(rawFixtureNoCaseloadCategory),
  ).toThrowErrorMatchingInlineSnapshot(`
    [ZodError: [
      {
        "code": "invalid_type",
        "expected": "string",
        "received": "undefined",
        "path": [
          "caseloadCategory"
        ],
        "message": "Required"
      }
    ]]
  `);
});
