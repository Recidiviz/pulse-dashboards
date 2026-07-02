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

import { cloneDeep } from "lodash-es";

import { usMoOverdueRestrictiveHousingInitialHearingFixtures } from "./fixtures";
import { usMoOverdueRestrictiveHousingInitialHearingSchema } from "./schema";

test.each(
  Object.keys(usMoOverdueRestrictiveHousingInitialHearingFixtures) as Array<
    keyof typeof usMoOverdueRestrictiveHousingInitialHearingFixtures
  >,
)("schema for %s", (key) => {
  expect(
    usMoOverdueRestrictiveHousingInitialHearingSchema.parse(
      usMoOverdueRestrictiveHousingInitialHearingFixtures[key].input,
    ),
  ).toMatchSnapshot();
});

test("schema when usMoInitialHearingPastDueDate moves from eligibleCriteria to ineligibleCriteria", () => {
  const record = cloneDeep(
    usMoOverdueRestrictiveHousingInitialHearingFixtures["eligible"].input,
  );
  const { usMoInitialHearingPastDueDate } = record.eligibleCriteria;
  record.ineligibleCriteria.usMoInitialHearingPastDueDate =
    usMoInitialHearingPastDueDate;
  record.eligibleCriteria.usMoInitialHearingPastDueDate = undefined;
  expect(
    usMoOverdueRestrictiveHousingInitialHearingSchema.parse(record),
  ).toMatchSnapshot();
});
