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

import { testTranslation } from "../../utils/testTranslation";

test("full date format", async () => {
  expect(
    await testTranslation("{{testDate, formatFullDate}}", {
      testDate: new Date(2025, 8, 2),
    }),
  ).toMatchInlineSnapshot(`"September 2, 2025"`);

  expect(
    await testTranslation(
      "{{testDate, formatFullDate}}",
      {
        testDate: new Date(2025, 8, 2),
      },
      "es",
    ),
  ).toMatchInlineSnapshot(`"2 de septiembre de 2025"`);
});

test("missing value", async () => {
  expect(
    await testTranslation("{{testDate, formatFullDate}}", {
      testDate: undefined,
    }),
  ).toMatchInlineSnapshot(`""`);
});

test("missing value with fallback", async () => {
  expect(
    await testTranslation(
      "{{testDate, formatFullDate(fallbackText: 'No date provided')}}",
      {
        testDate: undefined,
      },
    ),
  ).toMatchInlineSnapshot(`"No date provided"`);
});
