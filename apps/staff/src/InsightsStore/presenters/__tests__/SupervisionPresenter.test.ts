// Recidiviz - a data platform for criminal justice reform
// Copyright (C) 2023 Recidiviz, Inc.
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

import { configure } from "mobx";

import { RootStore } from "../../../RootStore";
import { InsightsStore } from "../../InsightsStore";
import { SupervisionPresenter } from "../SupervisionPresenter";

let store: InsightsStore;
let presenter: SupervisionPresenter;

beforeEach(() => {
  configure({ safeDescriptors: false });
  store = new RootStore().insightsStore;
  presenter = new SupervisionPresenter(store);
});

afterEach(() => {
  jest.restoreAllMocks();
  configure({ safeDescriptors: true });
});

test("hydrate", async () => {
  jest
    .spyOn(store.rootStore.userStore, "userAppMetadata", "get")
    .mockReturnValue({
      externalId: "abc123",
      pseudonymizedId: "hashed-mdavis123",
      district: "District One",
      stateCode: "us_mi",
    });
  jest.spyOn(InsightsStore.prototype, "populateSupervisionStore");

  expect(presenter.hydrationState).toEqual({ status: "needs hydration" });

  const hydrationPromise = presenter.hydrate();
  expect(presenter.hydrationState).toEqual({ status: "loading" });

  await hydrationPromise;

  expect(presenter.hydrationState).toEqual({ status: "hydrated" });
  expect(store.populateSupervisionStore).toHaveBeenCalled();

  // For some reason creating a spy of hydrateUserInfo does not work so this serves the same purpose
  expect(store.supervisionStore).toBeDefined();
  // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
  expect(store.supervisionStore!.userInfo).toBeDefined();
});

test("hydration error", async () => {
  const err = new Error("oops");
  jest
    .spyOn(InsightsStore.prototype, "populateSupervisionStore")
    .mockImplementation(() => {
      throw err;
    });

  await presenter.hydrate();

  expect(presenter.hydrationState).toEqual({ status: "failed", error: err });
});

test("no redundant hydration while in progress", async () => {
  jest.spyOn(store, "populateSupervisionStore");

  const h1 = presenter.hydrate();
  const h2 = presenter.hydrate();

  await Promise.all([h1, h2]);
  expect(store.populateSupervisionStore).toHaveBeenCalledTimes(1);
});

test("don't hydrate if already hydrated", async () => {
  jest.spyOn(store, "populateSupervisionStore");
  jest
    .spyOn(store.rootStore.userStore, "userAppMetadata", "get")
    .mockReturnValue({
      externalId: "abc123",
      pseudonymizedId: "hashed-mdavis123",
      district: "District One",
      stateCode: "us_mi",
    });

  await presenter.hydrate();
  expect(presenter.hydrationState).toEqual({ status: "hydrated" });
  presenter.hydrate();

  expect(store.populateSupervisionStore).toHaveBeenCalledTimes(1);
});
