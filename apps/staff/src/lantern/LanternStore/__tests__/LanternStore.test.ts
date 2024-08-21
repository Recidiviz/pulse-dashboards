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

import { MockInstance } from "vitest";

import RootStore from "../../../RootStore";
import LanternStore from "..";
import UserRestrictionsStore from "../UserRestrictionsStore";

vi.mock("../../../api/metrics");
vi.mock("../DataStore/DataStore");
vi.mock("../../../RootStore/TenantStore", () => {
  return {
    default: vi.fn().mockImplementation(() => {
      return {
        currentTenantId: "US_MO",
        methodology: {},
        enableUserRestrictions: true,
      };
    }),
  };
});
vi.mock("../../../RootStore/UserStore", () => {
  return {
    default: vi.fn().mockImplementation(() => {
      return {
        user: {},
        allowedSupervisionLocationIds: [],
        userIsLoading: false,
      };
    }),
  };
});

let lanternStore: LanternStore = new LanternStore(RootStore);

describe("LanternStore", () => {
  let verifyUserRestrictionsSpy: MockInstance;
  beforeEach(() => {
    verifyUserRestrictionsSpy = vi.spyOn(
      UserRestrictionsStore.prototype,
      "verifyUserRestrictions",
    );
    lanternStore = new LanternStore(RootStore);
  });
  it("contains a FiltersStore", () => {
    expect(lanternStore.filtersStore).toBeDefined();
  });

  it("contains a TenantStore", () => {
    expect(lanternStore.tenantStore).toBeDefined();
  });

  it("contains a UserStore", () => {
    expect(lanternStore.userStore).toBeDefined();
  });

  it("contains a UserRestrictionsStore", () => {
    expect(lanternStore.userRestrictionsStore).toBeDefined();
  });

  it("contains a currentTenantId", () => {
    expect(lanternStore.currentTenantId).toBeDefined();
  });

  it("contains filters", () => {
    expect(lanternStore.filters).toBeDefined();
  });

  it("contains methodology", () => {
    expect(lanternStore.methodology).toBeDefined();
  });

  it("contains the DataStore", () => {
    expect(lanternStore.dataStore).toBeDefined();
  });

  it("contains the DistrictsStore", () => {
    expect(lanternStore.districtsStore).toBeDefined();
  });

  it("contains a user", () => {
    expect(lanternStore.user).toBeDefined();
  });

  it("calls userRestrictionsStore.verifyUserRestrictions", () => {
    expect(verifyUserRestrictionsSpy).toHaveBeenCalledTimes(1);
  });
});
