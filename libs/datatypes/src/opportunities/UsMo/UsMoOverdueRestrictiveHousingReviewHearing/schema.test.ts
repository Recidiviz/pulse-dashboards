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

import { usMoOverdueRestrictiveHousingReviewHearingFixtures } from "./fixtures";
import { usMoOverdueRestrictiveHousingReviewHearingSchema } from "./schema";

test.each(
  Object.keys(usMoOverdueRestrictiveHousingReviewHearingFixtures) as Array<
    keyof typeof usMoOverdueRestrictiveHousingReviewHearingFixtures
  >,
)("schema for %s", (key) => {
  expect(
    usMoOverdueRestrictiveHousingReviewHearingSchema.parse(
      usMoOverdueRestrictiveHousingReviewHearingFixtures[key].input,
    ),
  ).toMatchSnapshot();
});

test("schema infers nextReviewDate via addDays(30) when usMoPastLatestScheduledReviewDate is null in ineligibleCriteria", () => {
  const record = cloneDeep(
    usMoOverdueRestrictiveHousingReviewHearingFixtures["eligible"].input,
  );
  record.ineligibleCriteria.usMoPastLatestScheduledReviewDate = null;
  record.eligibleCriteria.usMoPastLatestScheduledReviewDate = undefined;
  const parsed = usMoOverdueRestrictiveHousingReviewHearingSchema.parse(record);
  expect(
    parsed.ineligibleCriteria.usMoPastLatestScheduledReviewDate,
  ).toMatchSnapshot();
});
