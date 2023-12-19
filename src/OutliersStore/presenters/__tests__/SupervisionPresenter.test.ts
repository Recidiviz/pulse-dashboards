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
import { OutliersStore } from "../../OutliersStore";
import { SupervisionPresenter } from "../SupervisionPresenter";

let store: OutliersStore;
let presenter: SupervisionPresenter;

beforeEach(() => {
  configure({ safeDescriptors: false });
  store = new RootStore().outliersStore;
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
      role: "supervision_staff",
      externalId: "abc123",
      pseudonymizedId: "hashed-mdavis123",
      district: "District One",
      stateCode: "us_mi",
    });
  jest.spyOn(OutliersStore.prototype, "hydrateSupervisionStore");

  expect(presenter.hydrationState).toEqual({ status: "needs hydration" });

  const hydrationPromise = presenter.hydrate();
  expect(presenter.hydrationState).toEqual({ status: "loading" });

  await hydrationPromise;

  expect(presenter.hydrationState).toEqual({ status: "hydrated" });
  expect(store.hydrateSupervisionStore).toHaveBeenCalled();

  // For some reason creating a spy of hydrateUserInfo does not work so this serves the same purpose
  expect(store.supervisionStore).toBeDefined();
  // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
  expect(store.supervisionStore!.userInfo).toBeDefined();
});

test("hydration error", async () => {
  const err = new Error("oops");
  jest
    .spyOn(OutliersStore.prototype, "hydrateSupervisionStore")
    .mockImplementation(() => {
      throw err;
    });

  await presenter.hydrate();

  expect(presenter.hydrationState).toEqual({ status: "failed", error: err });
});

test("no redundant hydration while in progress", () => {
  jest.spyOn(store, "hydrateSupervisionStore");

  presenter.hydrate();
  presenter.hydrate();
  expect(store.hydrateSupervisionStore).toHaveBeenCalledTimes(1);
});

test("don't hydrate if already hydrated", async () => {
  jest.spyOn(store, "hydrateSupervisionStore");

  await presenter.hydrate();
  presenter.hydrate();

  expect(store.hydrateSupervisionStore).toHaveBeenCalledTimes(1);
});
