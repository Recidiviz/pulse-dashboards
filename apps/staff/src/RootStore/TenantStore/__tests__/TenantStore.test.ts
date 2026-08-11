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

function buildTenantStore() {
  const userStore = {
    activeFeatureVariants: {},
    userIsLoading: true,
  };
  const rootStore = { userStore } as unknown as RootStore;
  return new TenantStore({
    rootStore,
    tenantConfigs: {} as TenantConfigs,
  });
}

describe("TenantStore.tasksTableColumns", () => {
  it("returns the default Tasks-page column set when no tenant config is present", () => {
    const tenantStore = buildTenantStore();
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
});

describe("TenantStore.clientProfileSections / clientProfileRightColumnSections", () => {
  it("returns undefined when there is no current tenant", () => {
    const tenantStore = buildTenantStore();
    expect(tenantStore.clientProfileSections).toBeUndefined();
    expect(tenantStore.clientProfileRightColumnSections).toBeUndefined();
  });

  it("returns undefined when the tenant config has no clientProfileConfig", () => {
    const tenantStore = buildTenantStore();
    tenantStore.tenantConfigs = {
      US_TN: {},
    } as unknown as TenantConfigs;
    tenantStore.setCurrentTenantId("US_TN");

    expect(tenantStore.clientProfileSections).toBeUndefined();
    expect(tenantStore.clientProfileRightColumnSections).toBeUndefined();
  });

  it("returns the tenant's configured sections when clientProfileConfig is present", () => {
    const tenantStore = buildTenantStore();
    tenantStore.tenantConfigs = {
      US_TN: {
        clientProfileConfig: {
          sections: ["Contact", "FinesAndFees"],
          rightColumnSections: ["SpecialConditions"],
        },
      },
    } as unknown as TenantConfigs;
    tenantStore.setCurrentTenantId("US_TN");

    expect(tenantStore.clientProfileSections).toEqual([
      "Contact",
      "FinesAndFees",
    ]);
    expect(tenantStore.clientProfileRightColumnSections).toEqual([
      "SpecialConditions",
    ]);
  });
});
