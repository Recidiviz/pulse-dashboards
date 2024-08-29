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

import { rawSupervisionOfficerFixture } from "../offlineFixtures/SupervisionOfficerFixture";
import { supervisionOfficerSchema } from "../SupervisionOfficer";

test("transformations", () => {
  rawSupervisionOfficerFixture.forEach((so) =>
    expect(supervisionOfficerSchema.parse(so)).toMatchSnapshot(),
  );
});

test("caseload type is renamed to caseload category", () => {
  const { caseloadCategory, ...rawFixtureNoCaseloadCategory } =
    rawSupervisionOfficerFixture[0];
  const rawFixtureCaseloadType = {
    caseloadType: caseloadCategory,
    ...rawFixtureNoCaseloadCategory,
  };

  const parsedSupervisionOfficer = supervisionOfficerSchema.parse(
    rawFixtureCaseloadType,
  );
  expect(
    Object.prototype.hasOwnProperty.call(
      parsedSupervisionOfficer,
      "caseloadType",
    ),
  ).toBeFalse();
  expect(
    Object.prototype.hasOwnProperty.call(
      parsedSupervisionOfficer,
      "caseloadCategory",
    ),
  ).toBeTrue();
});

test("missing caseload type / category fails parsing", () => {
  const { caseloadCategory, ...rawFixtureNoCaseloadCategory } =
    rawSupervisionOfficerFixture[0];

  expect(() => supervisionOfficerSchema.parse(rawFixtureNoCaseloadCategory))
    .toThrowErrorMatchingInlineSnapshot(`
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
