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
import { outputFixture, usMeResidents, usMeSccpFixtures } from "~datatypes";

import { residentsConfigByState } from "../../configs/residentsConfig";
import { RootStore } from "../../datastores/RootStore";
import { OfflineAPIClient } from "./OfflineAPIClient";

let api: OfflineAPIClient;

beforeEach(() => {
  api = new OfflineAPIClient(new RootStore());
});

test("residents should reflect state code", async () => {
  const residents = await api.residents();
  // sanity check
  expect(residents.length).toBeGreaterThan(0);
  residents.forEach((r) => expect(r.stateCode).toBe("US_ME"));
});

test("fetch single resident", async () => {
  const expectedRes = outputFixture(usMeResidents[0]);

  const fetched = await api.residentById(expectedRes.personExternalId);

  expect(fetched).toEqual(expectedRes);
});

test("missing single resident", async () => {
  await expect(
    api.residentById("does-not-exist"),
  ).rejects.toThrowErrorMatchingInlineSnapshot(
    `[Error: Missing data for resident does-not-exist in US_ME]`,
  );
});

test("local config object", async () => {
  const expectedConfig = residentsConfigByState.US_ME;

  const fetched = await api.residentsConfig();

  expect(fetched).toEqual(expectedConfig);
});

test("eligibility record", async () => {
  const expectedRecord = outputFixture(
    usMeSccpFixtures.fullyEligibleHalfPortion,
  );

  const fetched = await api.residentEligibility(
    outputFixture(usMeResidents[3]).personExternalId,
    "usMeSCCP",
  );

  expect(fetched).toEqual(expectedRecord);
});

test("missing eligibility record", async () => {
  const fetched = await api.residentEligibility("does-not-exist", "usMeSCCP");
  expect(fetched).toBeUndefined();
});