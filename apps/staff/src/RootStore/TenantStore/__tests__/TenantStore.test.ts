// Recidiviz - a data platform for criminal justice reform
// Copyright (C) 2026 Recidiviz, Inc.
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

import { TenantConfigs } from "../../../tenants";
import type { RootStore } from "../..";
import TenantStore from "..";

function buildTenantStore({
  usMoMyCaseload = false,
}: { usMoMyCaseload?: boolean } = {}) {
  const userStore = {
    activeFeatureVariants: usMoMyCaseload ? { usMoMyCaseload: {} } : {},
    userIsLoading: true,
  };
  const rootStore = { userStore } as unknown as RootStore;
  return new TenantStore({
    rootStore,
    tenantConfigs: {} as TenantConfigs,
  });
}

describe("TenantStore.tasksTableColumns", () => {
  it("returns the default Tasks-page column set when usMoMyCaseload is off", () => {
    const tenantStore = buildTenantStore({ usMoMyCaseload: false });
    expect(tenantStore.tasksTableColumns).toEqual([
      "name",
      "id",
      "task",
      "dueDate",
      "frequency",
      "supervisionLevel",
      "caseType",
      "tasksDue",
    ]);
  });

  it("returns the MyCaseload column set when usMoMyCaseload is on", () => {
    const tenantStore = buildTenantStore({ usMoMyCaseload: true });
    expect(tenantStore.tasksTableColumns).toEqual([
      "name",
      "id",
      "supervisionLevel",
      "caseType",
      "tasks",
    ]);
  });
});
