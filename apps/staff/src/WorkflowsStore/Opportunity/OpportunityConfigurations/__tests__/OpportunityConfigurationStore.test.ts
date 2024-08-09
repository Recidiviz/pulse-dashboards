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

import { RootStore } from "../../../../RootStore";
import { OpportunityConfigurationStore } from "../OpportunityConfigurationStore";

const rootStore = new RootStore();
let store: OpportunityConfigurationStore;

beforeEach(() => {
  rootStore.tenantStore.setCurrentTenantId("US_OR");
  store = new OpportunityConfigurationStore(rootStore);
  store.mockHydrated();
});

test("changing tenant ID resets store", async () => {
  rootStore.tenantStore.setCurrentTenantId("US_CA");
  expect(store.hydrationState.status).toEqual("needs hydration");
});

test("getOpportunityTypeFromUrl for existing opportunity url", async () => {
  expect(store.getOpportunityTypeFromUrl("earnedDischarge")).toBe(
    "usOrEarnedDischarge",
  );
});

test("getOpportunityTypeFromUrl for various tenants", async () => {
  expect(store.getOpportunityTypeFromUrl("earnedDischarge")).toBe(
    "usOrEarnedDischarge",
  );
  rootStore.tenantStore.setCurrentTenantId("US_ID");
  store.mockHydrated();
  expect(store.getOpportunityTypeFromUrl("earnedDischarge")).toBe(
    "earnedDischarge",
  );
});

test("getOpportunityTypeFromUrl for nonexistent opportunity url", async () => {
  expect(store.getOpportunityTypeFromUrl("fakeUrl")).toBe(undefined);
});
