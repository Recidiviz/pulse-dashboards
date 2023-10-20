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

import { RootStore } from "../../../RootStore";
import { OutliersStore } from "../../OutliersStore";
import { SupervisionPresenter } from "../SupervisionPresenter";

let store: OutliersStore;
let presenter: SupervisionPresenter;

beforeEach(() => {
  store = new RootStore().outliersStore;
  presenter = new SupervisionPresenter(store);
});

afterEach(() => {
  jest.restoreAllMocks();
});

test("hydrate", async () => {
  jest.spyOn(OutliersStore.prototype, "hydrateSupervisionStore");

  expect(presenter.isHydrated).toBeFalse();
  expect(presenter.isLoading).toBeFalsy();

  const hydrationPromise = presenter.hydrate();
  expect(presenter.isLoading).toBeTrue();

  await hydrationPromise;

  expect(presenter.isHydrated).toBeTrue();
  expect(store.hydrateSupervisionStore).toHaveBeenCalled();
  expect(presenter.isLoading).toBeFalse();
});

test("hydration error", async () => {
  const err = new Error("oops");
  jest
    .spyOn(OutliersStore.prototype, "hydrateSupervisionStore")
    .mockImplementation(() => {
      throw err;
    });

  expect(presenter.error).toBeUndefined();

  await presenter.hydrate();

  expect(presenter.isHydrated).toBeFalse();
  expect(presenter.isLoading).toBeFalse();
  expect(presenter.error).toEqual(err);
});
