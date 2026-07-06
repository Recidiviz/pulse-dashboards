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

import { usPaAdminSupervisionFixtures } from "./fixtures";
import { usPaAdminSupervisionSchema } from "./schema";

test("record parses as expected", () => {
  expect(
    usPaAdminSupervisionSchema.parse(
      usPaAdminSupervisionFixtures.fullyEligible.input,
    ),
  ).toMatchSnapshot();
});

test("parses null reason fields", () => {
  expect(
    usPaAdminSupervisionSchema.parse(
      usPaAdminSupervisionFixtures.nullReasonFields.input,
    ),
  ).toMatchSnapshot();
});

test("parses empty ineligible offenses array", () => {
  expect(
    usPaAdminSupervisionSchema.parse(
      usPaAdminSupervisionFixtures.emptyIneligibleOffenses.input,
    ),
  ).toMatchSnapshot();
});
