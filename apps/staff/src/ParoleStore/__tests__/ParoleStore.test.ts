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

import { RootStore } from "../../RootStore";
import { ParoleStore } from "../ParoleStore";

describe("ParoleStore", () => {
  describe("config", () => {
    it("returns the current tenant's paroleConfig", () => {
      const rootStore = new RootStore();
      rootStore.tenantStore.currentTenantId = "US_CO";
      const paroleStore = new ParoleStore(rootStore);

      expect(paroleStore.config).toEqual(
        rootStore.tenantStore.currentTenantConfig?.paroleConfig,
      );
    });

    it("throws when no tenant is configured", () => {
      const paroleStore = new ParoleStore(new RootStore());

      expect(() => paroleStore.config).toThrow(/no current tenant configured/);
    });

    it("throws when the current tenant has no paroleConfig set", () => {
      const rootStore = new RootStore();
      // US_CO always sets paroleConfig in practice -- build a copy of
      // tenantConfigs with it stripped from US_CO, rather than mutating the
      // real (module-singleton) US_CO config, to exercise a tenant that
      // enables Parole nav without configuring it.

      const { paroleConfig, ...usCoWithoutParoleConfig } =
        rootStore.tenantStore.tenantConfigs.US_CO;
      rootStore.tenantStore.tenantConfigs = {
        ...rootStore.tenantStore.tenantConfigs,
        US_CO: usCoWithoutParoleConfig,
      };
      rootStore.tenantStore.currentTenantId = "US_CO";
      const paroleStore = new ParoleStore(rootStore);

      expect(() => paroleStore.config).toThrow(
        /Tenant \[US_CO\] has no paroleConfig set/,
      );
    });
  });
});
