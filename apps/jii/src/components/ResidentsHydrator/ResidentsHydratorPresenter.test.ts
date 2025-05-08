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

import { configure } from "mobx";

import { RootStore } from "../../datastores/RootStore";
import { ResidentsHydratorPresenter } from "./ResidentsHydratorPresenter";

let store: RootStore;
let presenter: ResidentsHydratorPresenter;

beforeEach(() => {
  configure({ safeDescriptors: false });
  store = new RootStore();
});

afterEach(() => {
  configure({ safeDescriptors: true });
});

beforeEach(() => {
  presenter = new ResidentsHydratorPresenter(store, "US_ME");
});

test("hydrate", async () => {
  vi.spyOn(RootStore.prototype, "populateResidentsStore");

  expect(presenter.hydrationState).toEqual({ status: "needs hydration" });

  const hydrationPromise = presenter.hydrate();
  expect(presenter.hydrationState).toEqual({ status: "loading" });

  await hydrationPromise;

  expect(presenter.hydrationState).toEqual({ status: "hydrated" });
  expect(store.populateResidentsStore).toHaveBeenCalled();

  expect(store.residentsStore).toBeDefined();
});

test("hydration error", async () => {
  const err = new Error("oops");
  vi.spyOn(RootStore.prototype, "populateResidentsStore").mockImplementation(
    () => {
      throw err;
    },
  );

  await presenter.hydrate();

  expect(presenter.hydrationState).toEqual({ status: "failed", error: err });
});

test("no redundant hydration while in progress", async () => {
  vi.spyOn(store, "populateResidentsStore");

  const h1 = presenter.hydrate();
  const h2 = presenter.hydrate();

  await Promise.all([h1, h2]);
  expect(store.populateResidentsStore).toHaveBeenCalledTimes(1);
});

test("don't hydrate if already hydrated", async () => {
  vi.spyOn(store, "populateResidentsStore");

  await presenter.hydrate();
  expect(presenter.hydrationState).toEqual({ status: "hydrated" });
  presenter.hydrate();

  expect(store.populateResidentsStore).toHaveBeenCalledTimes(1);
});
