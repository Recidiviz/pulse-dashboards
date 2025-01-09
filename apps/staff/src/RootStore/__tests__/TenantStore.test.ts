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

import { TenantConfigs } from "../../tenants";
import RootStore from "..";
import TenantStore, {
  CURRENT_TENANT_IN_SESSION,
} from "../TenantStore/TenantStore";
import UserStore from "../UserStore";

vi.mock("@auth0/auth0-spa-js");
vi.mock("../../api/metrics/metricsClient");
vi.mock("../../components/StoreProvider");

const METADATA_NAMESPACE = import.meta.env.VITE_METADATA_NAMESPACE;

const metadataField = `${METADATA_NAMESPACE}app_metadata`;
const user = {
  [metadataField]: { stateCode: "US_RESTRICTED" },
  email_verified: true,
};

const mockTenantConfigs = {
  US_RESTRICTED: {
    enableUserRestrictions: true,
  },
  US_UNRESTRICTED: {
    enableUserRestrictions: false,
  },
  US_TASKS: {
    workflowsTasksConfig: {
      task1: {},
      task4: {},
      task2: {},
    },
  },
} as any as TenantConfigs;

let tenantStore;
describe("TenantStore", () => {
  const tenantIdFromStorage = "TEST_TENANT";
  const tenantIdFromUser = "US_STATE";

  const createMockRootStore = (mockUserStore: any) =>
    ({
      userStore: mockUserStore as UserStore,
    }) as typeof RootStore;

  beforeEach(() => {
    vi.clearAllMocks();
    vi.resetAllMocks();
  });

  afterEach(() => {
    vi.clearAllMocks();
    vi.resetAllMocks();
  });

  describe("enableUserRestrictions", () => {
    it("returns true when a current tenant has restrictions enabled", () => {
      const mockRootStore = createMockRootStore({
        userIsLoading: false,
        availableStateCodes: ["US_RESTRICTED"],
        allowedSupervisionLocationIds: ["25"],
        userHasAccess: () => true,
        user,
      });
      tenantStore = new TenantStore({
        rootStore: mockRootStore,
        tenantConfigs: mockTenantConfigs,
      });
      expect(tenantStore.enableUserRestrictions).toEqual(true);
    });
    it("returns false when a current tenant does not have restrictions enabled", () => {
      const mockRootStore = createMockRootStore({
        userIsLoading: false,
        availableStateCodes: ["US_UNRESTRICTED"],
        allowedSupervisionLocationIds: [],
        userHasAccess: () => true,
        user: {
          [metadataField]: { stateCode: "US_UNRESTRICTED" },
          email_verified: true,
        },
      });
      tenantStore = new TenantStore({
        rootStore: mockRootStore,
        tenantConfigs: mockTenantConfigs,
      });
      expect(tenantStore.enableUserRestrictions).toEqual(false);
    });

    it("returns true for recidiviz users with restrictions", () => {
      const mockRootStore = createMockRootStore({
        userIsLoading: false,
        availableStateCodes: ["US_RESTRICTED", "US_UNRESTRICTED"],
        allowedSupervisionLocationIds: ["25"],
        userHasAccess: () => true,
        user: {
          [metadataField]: { stateCode: "recidiviz" },
          email_verified: true,
        },
      });
      tenantStore = new TenantStore({
        rootStore: mockRootStore,
        tenantConfigs: mockTenantConfigs,
      });
      expect(tenantStore.enableUserRestrictions).toEqual(true);
    });
    it("returns false for recidiviz users without restrictions", () => {
      const mockRootStore = createMockRootStore({
        userIsLoading: false,
        availableStateCodes: ["US_RESTRICTED", "US_UNRESTRICTED"],
        allowedSupervisionLocationIds: [],
        userHasAccess: () => true,
        user: {
          [metadataField]: { stateCode: "recidiviz" },
          email_verified: true,
        },
      });
      tenantStore = new TenantStore({
        rootStore: mockRootStore,
        tenantConfigs: mockTenantConfigs,
      });
      expect(tenantStore.enableUserRestrictions).toEqual(false);
    });

    it("returns false for restrictions in the wrong format", () => {
      const mockRootStore = createMockRootStore({
        userIsLoading: false,
        availableStateCodes: ["US_RESTRICTED"],
        allowedSupervisionLocationIds: "some string",
        userHasAccess: () => true,
        user: {
          [metadataField]: { stateCode: "US_RESTRICTED" },
          email_verified: true,
        },
      });
      tenantStore = new TenantStore({
        rootStore: mockRootStore,
        tenantConfigs: mockTenantConfigs,
      });
      expect(tenantStore.enableUserRestrictions).toEqual(false);
    });
  });

  describe("when there is a CURRENT_TENANT_IN_SESSION", () => {
    beforeEach(() => {
      sessionStorage.setItem(CURRENT_TENANT_IN_SESSION, tenantIdFromStorage);
      vi.clearAllMocks();
      vi.resetAllMocks();
    });

    afterEach(() => {
      vi.clearAllMocks();
      vi.resetAllMocks();
    });

    it("currentTenantId is set to CURRENT_TENANT_IN_SESSION if there is not a user", async () => {
      const mockRootStore = createMockRootStore({
        userIsLoading: false,
        availableStateCodes: [],
        userHasAccess: () => false,
      });
      tenantStore = new TenantStore({
        rootStore: mockRootStore,
        tenantConfigs: mockTenantConfigs,
      });
      expect(tenantStore.currentTenantId).toEqual(tenantIdFromStorage);
    });

    it("currentTenantId is set to CURRENT_TENANT_IN_SESSION if the user has access", async () => {
      const mockRootStore = createMockRootStore({
        userIsLoading: false,
        availableStateCodes: [tenantIdFromUser],
        userHasAccess: () => true,
        user,
      });
      tenantStore = new TenantStore({
        rootStore: mockRootStore,
        tenantConfigs: mockTenantConfigs,
      });

      expect(tenantStore.currentTenantId).toEqual(tenantIdFromStorage);
    });

    it("currentTenantId is set to availableStateCodes if the user does not have access", async () => {
      const availableStateCodes = ["BARNEY", "RUBBLE"];
      const mockRootStore = createMockRootStore({
        userIsLoading: false,
        availableStateCodes,
        userHasAccess: () => false,
        user,
      });

      tenantStore = new TenantStore({
        rootStore: mockRootStore,
        tenantConfigs: mockTenantConfigs,
      });
      expect(tenantStore.currentTenantId).toEqual(availableStateCodes[0]);
    });
  });

  describe("when there is a tenantId in the url query", () => {
    beforeEach(() => {
      // Prevents jsdom from throwing an error that it hasn't implemented navigation
      // since we don't care about actually navigating, only reading from the current
      // location, this works.
      // @ts-expect-error
      delete window.location;
      window.location = { search: "?tenantId=US_TN" } as Location;
      sessionStorage.setItem(CURRENT_TENANT_IN_SESSION, tenantIdFromStorage);
    });

    it("currentTenantId is set to the tenantId in the url query", () => {
      const mockRootStore = createMockRootStore({
        userIsLoading: false,
        availableStateCodes: [tenantIdFromUser],
        userHasAccess: () => true,
        user,
        isRecidivizUser: true,
      });
      tenantStore = new TenantStore({
        rootStore: mockRootStore,
        tenantConfigs: mockTenantConfigs,
      });

      expect(tenantStore.currentTenantId).toEqual("US_TN");
    });

    it("currentTenantId is not set to the tenantId in the url query for non-Recidiviz users", () => {
      const mockRootStore = createMockRootStore({
        userIsLoading: false,
        availableStateCodes: [tenantIdFromUser],
        userHasAccess: () => true,
        user,
        isRecidivizUser: false,
      });
      tenantStore = new TenantStore({
        rootStore: mockRootStore,
        tenantConfigs: mockTenantConfigs,
      });

      expect(tenantStore.currentTenantId).toEqual(tenantIdFromStorage);
    });
  });

  describe("when getting task configurations", () => {
    beforeEach(() => {
      sessionStorage.clear();
      vi.clearAllMocks();
      vi.resetAllMocks();
    });

    it("preserves the order of task types in workflowsTasksConfig", () => {
      const mockRootStore = createMockRootStore({
        userIsLoading: false,
        userHasAccess: () => true,
        availableStateCodes: ["US_TASKS"],
        user: {
          [metadataField]: { stateCode: "US_TASKS" },
          email_verified: true,
        },
      });
      tenantStore = new TenantStore({
        rootStore: mockRootStore,
        tenantConfigs: mockTenantConfigs,
      });
      expect(tenantStore.taskCategories).toEqual(["task1", "task4", "task2"]);
    });

    it("returns a sane default when tasks are not configured", () => {
      const mockRootStore = createMockRootStore({
        userIsLoading: false,
        userHasAccess: () => true,
        availableStateCodes: ["US_UNRESTRICTED"],
        user: {
          [metadataField]: { stateCode: "US_UNRESTRICTED" },
          email_verified: true,
        },
      });
      tenantStore = new TenantStore({
        rootStore: mockRootStore,
        tenantConfigs: mockTenantConfigs,
      });
      expect(tenantStore.taskCategories).toEqual([]);
    });
  });
});
