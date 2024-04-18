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

import { flowResult } from "mobx";

import {
  incarcerationStaffFixtures,
  outputFixture,
  outputFixtureArray,
  usMeResidents,
} from "~datatypes";

import { OfflineAPIClient } from "../api/OfflineAPIClient";
import { ResidentsStore } from "./ResidentsStore";
import { RootStore } from "./RootStore";

let store: ResidentsStore;

beforeEach(() => {
  store = new ResidentsStore(new RootStore());
});

test("populate all residents", async () => {
  expect(store.residentsByExternalId.size).toBe(0);

  await flowResult(store.populateAllResidents());

  outputFixtureArray(usMeResidents).forEach((r) => {
    expect(store.residentsByExternalId.get(r.personExternalId)).toEqual(r);
  });
});

test("populate single resident", async () => {
  const expectedRes = outputFixture(usMeResidents[1]);

  expect(
    store.residentsByExternalId.get(expectedRes.personExternalId),
  ).toBeUndefined();

  await flowResult(store.populateResidentById(expectedRes.personExternalId));

  expect(store.residentsByExternalId.get(expectedRes.personExternalId)).toEqual(
    expectedRes,
  );
});

test("unable to populate single resident", async () => {
  await expect(
    flowResult(store.populateResidentById("does-not-exist")),
  ).rejects.toThrowErrorMatchingInlineSnapshot(
    `[Error: Missing data for resident does-not-exist in US_ME]`,
  );
});

test("populate single staff member", async () => {
  const expectedStaff = outputFixture(incarcerationStaffFixtures[1]);

  expect(store.assignedStaffByExternalId.get(expectedStaff.id)).toBeUndefined();

  await flowResult(store.populateAssignedStaffById(expectedStaff.id));

  expect(store.assignedStaffByExternalId.get(expectedStaff.id)).toEqual(
    expectedStaff,
  );
});

test("unable to populate single staff member", async () => {
  await expect(
    flowResult(store.populateAssignedStaffById("does-not-exist")),
  ).rejects.toThrowErrorMatchingInlineSnapshot(
    `[Error: Missing data for incarceration staff does-not-exist in US_ME]`,
  );
});

test("populate single staff member and related staff", async () => {
  const expectedRes = outputFixture(usMeResidents[1]);
  const expectedStaff = outputFixture(incarcerationStaffFixtures[1]);

  expect(
    store.residentsByExternalId.get(expectedRes.personExternalId),
  ).toBeUndefined();
  expect(store.assignedStaffByExternalId.get(expectedStaff.id)).toBeUndefined();

  await flowResult(
    store.populateResidentAndAssignedStaffById(expectedRes.personExternalId),
  );

  expect(store.residentsByExternalId.get(expectedRes.personExternalId)).toEqual(
    expectedRes,
  );
  expect(store.assignedStaffByExternalId.get(expectedStaff.id)).toEqual(
    expectedStaff,
  );
});

test("unable to populate staff member and related staff", async () => {
  vi.spyOn(
    OfflineAPIClient.prototype,
    "residentAndAssignedStaffById",
  ).mockRejectedValue("API FAILURE");

  await expect(
    flowResult(store.populateResidentAndAssignedStaffById("whatever")),
  ).rejects.toThrowErrorMatchingInlineSnapshot(`"API FAILURE"`);
});
