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

import { maxBy } from "lodash-es";

import { usMoOverdueRestrictiveHousingReleaseFixtures } from "./fixtures";
import { usMoOverdueRestrictiveHousingReleaseSchema } from "./schema";

const eligibleInput =
  usMoOverdueRestrictiveHousingReleaseFixtures["eligible"].input;

const inputWithNullSanctionsCriteria = {
  ...eligibleInput,
  eligibleCriteria: {
    ...eligibleInput.eligibleCriteria,
    usMoNoActiveProgressiveDisciplineSanctions: null,
  },
  metadata: {
    ...eligibleInput.metadata,
    allSanctions: [
      {
        sanctionCode: "D1",
        sanctionExpirationDate: "2023-12-05",
        sanctionId: 4000,
        sanctionStartDate: "2023-08-15",
      },
      {
        sanctionCode: "D1",
        sanctionExpirationDate: "2023-12-05",
        sanctionId: 4001,
        sanctionStartDate: "2023-08-24",
      },
    ],
  },
};

test.each(
  Object.keys(usMoOverdueRestrictiveHousingReleaseFixtures) as Array<
    keyof typeof usMoOverdueRestrictiveHousingReleaseFixtures
  >,
)("schema for %s", (key) => {
  expect(
    usMoOverdueRestrictiveHousingReleaseSchema.parse(
      usMoOverdueRestrictiveHousingReleaseFixtures[key].input,
    ),
  ).toMatchSnapshot();
});

test("schema when usMoNoActiveProgressiveDisciplineSanctions is null and allSanctions is undefined", () => {
  expect(
    usMoOverdueRestrictiveHousingReleaseSchema.parse({
      ...inputWithNullSanctionsCriteria,
      metadata: {
        ...inputWithNullSanctionsCriteria.metadata,
        allSanctions: undefined,
      },
    }),
  ).toMatchSnapshot();
});

test("schema when usMoNoActiveProgressiveDisciplineSanctions is null and allSanctions is defined", () => {
  expect(
    usMoOverdueRestrictiveHousingReleaseSchema.parse(
      inputWithNullSanctionsCriteria,
    ),
  ).toMatchSnapshot();
});

test("reconstructed latestSanctionEndDate equals the expiration date of the latest-start sanction", () => {
  const parsed = usMoOverdueRestrictiveHousingReleaseSchema.parse(
    inputWithNullSanctionsCriteria,
  );
  const { latestSanctionEndDate } =
    parsed.eligibleCriteria.usMoNoActiveProgressiveDisciplineSanctions ?? {};
  const latestSanction = maxBy(
    parsed.metadata.allSanctions,
    "sanctionStartDate",
  );
  expect(latestSanctionEndDate).toBeDefined();
  expect(latestSanctionEndDate).toEqual(latestSanction?.sanctionExpirationDate);
});
