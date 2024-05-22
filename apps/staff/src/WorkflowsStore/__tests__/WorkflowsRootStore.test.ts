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

import { RootStore } from "../../RootStore";
import { WorkflowsOfficersStore } from "../WorkflowsOfficersStore";
import { WorkflowsRootStore } from "../WorkflowsRootStore";

const rootStore = new RootStore();
rootStore.tenantStore.setCurrentTenantId("US_CA");
let store: WorkflowsRootStore;

beforeEach(() => {
  store = new WorkflowsRootStore(rootStore);
});

test("initialize workflows officers store", async () => {
  expect(store.workflowsOfficersStore).toBeUndefined();

  store.populateWorkflowsOfficersStore();

  expect(store.workflowsOfficersStore).toBeDefined();
});

test("changing tenant ID resets store", async () => {
  store.workflowsOfficersStore = new WorkflowsOfficersStore(store);
  rootStore.tenantStore.setCurrentTenantId("US_ID");
  expect(store.workflowsOfficersStore).toBeUndefined();
});
