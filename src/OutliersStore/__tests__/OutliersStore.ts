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

import { flowResult } from "mobx";

import { RootStore } from "../../RootStore";
import { OutliersStore } from "../OutliersStore";

let store: OutliersStore;

beforeEach(() => {
  store = new OutliersStore(new RootStore());
});

test("initialize supervision store", async () => {
  expect(store.supervisionStore).toBeUndefined();

  await flowResult(store.hydrateSupervisionStore());
  expect(store.supervisionStore).toBeDefined();
});

test("reset supervision store", async () => {
  await flowResult(store.hydrateSupervisionStore());
  expect(store.supervisionStore).toBeDefined();
  store.reset();
  expect(store.supervisionStore).toBeUndefined();
});

test("automatically reset when state code changes", async () => {
  await flowResult(store.hydrateSupervisionStore());
  expect(store.supervisionStore).toBeDefined();
  store.rootStore.tenantStore.setCurrentTenantId("US_MI");
  expect(store.supervisionStore).toBeUndefined();
});
