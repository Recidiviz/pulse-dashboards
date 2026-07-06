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

import { RootStore } from "../../RootStore";
import { InsightsStore } from "../InsightsStore";

let store: InsightsStore;

beforeEach(() => {
  store = new InsightsStore(new RootStore());
});

test("initialize supervision store", async () => {
  expect(store.supervisionStore).toBeUndefined();

  await flowResult(store.populateSupervisionStore());
  expect(store.supervisionStore).toBeDefined();
});

test("reset supervision store", async () => {
  await flowResult(store.populateSupervisionStore());
  expect(store.supervisionStore).toBeDefined();
  store.reset();
  expect(store.supervisionStore).toBeUndefined();
});

test("automatically reset when state code changes", async () => {
  await flowResult(store.populateSupervisionStore());
  expect(store.supervisionStore).toBeDefined();
  store.rootStore.tenantStore.setCurrentTenantId("US_MI");
  expect(store.supervisionStore).toBeUndefined();
});

test("automatically reset when the user's identity changes", async () => {
  store.rootStore.userStore.user = { email: "user@example.com" };
  await flowResult(store.populateSupervisionStore());
  expect(store.supervisionStore).toBeDefined();

  // e.g. switching to an impersonated user
  store.rootStore.userStore.user = { email: "impersonated@example.com" };
  expect(store.supervisionStore).toBeUndefined();
});

test("does not reset when the user object is replaced with identical content", async () => {
  store.rootStore.userStore.user = {
    email: "user@example.com",
    "https://dashboard.recidiviz.org/app_metadata": { stateCode: "US_NC" },
  };
  await flowResult(store.populateSupervisionStore());
  expect(store.supervisionStore).toBeDefined();

  // Auth0 rehydrates the user_metadata/app_metadata claim objects shortly after
  // login: a new user object with new nested references but identical content.
  // Structural comparison must treat this as unchanged, or it wipes an
  // already-populated store and deep-linked Insights pages get stuck on a 404
  // after the login redirect.
  store.rootStore.userStore.user = {
    email: "user@example.com",
    "https://dashboard.recidiviz.org/app_metadata": { stateCode: "US_NC" },
  };
  expect(store.supervisionStore).toBeDefined();
});
