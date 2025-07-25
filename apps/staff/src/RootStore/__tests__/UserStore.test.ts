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

import createAuth0Client, { User } from "@auth0/auth0-spa-js";
import * as Sentry from "@sentry/react";
import { add } from "date-fns";
import { runInAction } from "mobx";
import { Mock } from "vitest";

import { isDemoMode } from "~client-env-utils";

import { fetchImpersonatedUserAppMetadata } from "../../api/fetchImpersonatedUserAppMetadata";
import { ERROR_MESSAGES } from "../../constants/errorMessages";
import {
  DASHBOARD_VIEWS,
  PATHWAYS_PAGES,
  PATHWAYS_SECTIONS,
  UNRESTRICTED_PAGES,
} from "../../core/views";
import { TENANT_CONFIGS } from "../../tenants";
import isIE11 from "../../utils/isIE11";
import RootStore from "..";
import { FeatureVariant, TenantId } from "../types";
import UserStore, { SESSION_FEATURE_VARIANT_OVERRIDES } from "../UserStore";
vi.mock("@auth0/auth0-spa-js");
vi.mock("@sentry/react");
vi.mock("firebase/firestore");
vi.mock("../../utils/isIE11");
vi.mock("../../api/fetchImpersonatedUserAppMetadata");
vi.mock("~client-env-utils");

const METADATA_NAMESPACE = import.meta.env.VITE_METADATA_NAMESPACE;

const mockCreateAuth0Client = createAuth0Client as Mock;
const mockGetUser = vi.fn();
const mockHandleRedirectCallback = vi.fn();
const mockIsAuthenticated = vi.fn();
const mockLoginWithRedirect = vi.fn();
const mockGetTokenSilently = vi.fn();

const mockHandleUrl = vi.fn();
const mockIsIE11 = isIE11 as Mock;
const mockFetchImpersonatedUserAppMetadata = vi.mocked(
  fetchImpersonatedUserAppMetadata,
);

const mockRootStore = {
  analyticsStore: {
    identify: vi.fn(),
  },
  firestoreStore: {
    authenticate: vi.fn(),
  },
  workflowsStore: {
    disposeUserProfileSubscriptions: vi.fn(),
  },
  tenantStore: {
    setCurrentTenantId: vi.fn(),
    tenantFeatureVariants: {},
  },
} as unknown as typeof RootStore;

const tenantId = "US_MO";
const metadataField = `${METADATA_NAMESPACE}app_metadata`;
const metadata = { [metadataField]: { stateCode: tenantId } };
const testAuthSettings = {
  domain: "example.com",
  client_id: "abc123",
  redirect_url: window.location.href,
};

beforeEach(() => {
  mockGetUser.mockResolvedValue(metadata);
  mockCreateAuth0Client.mockResolvedValue({
    getUser: mockGetUser,
    handleRedirectCallback: mockHandleRedirectCallback,
    isAuthenticated: mockIsAuthenticated,
    loginWithRedirect: mockLoginWithRedirect,
    getTokenSilently: mockGetTokenSilently,
  });
  mockIsIE11.mockReturnValue(false);
});

test("authorization immediately pending", () => {
  const store = new UserStore({});
  expect(store.isAuthorized).toBe(false);
  expect(store.userIsLoading).toBe(true);
});

test("authorize requires Auth0 client settings", async () => {
  const store = new UserStore({});
  await store.authorize(mockHandleUrl);
  const error = store.authError;
  expect(error?.message).toMatch(ERROR_MESSAGES.auth0Configuration);
});

test("error thrown in authorize sets authError", async () => {
  mockCreateAuth0Client.mockResolvedValue("INALID_AUTH_OBJECT");
  const store = new UserStore({
    authSettings: testAuthSettings,
  });
  await store.authorize(mockHandleUrl);
  const error = store.authError;
  expect(error?.message).toBeDefined();
});

test("Invalid state thrown in authorize redirects to login", async () => {
  mockHandleRedirectCallback.mockResolvedValue(new Error("Invalid state"));
  expect(mockLoginWithRedirect.mock.calls.length).toBe(0);

  const store = new UserStore({
    authSettings: testAuthSettings,
  });
  await store.authorize(mockHandleUrl);

  expect(mockLoginWithRedirect.mock.calls.length).toBe(1);
  expect(mockLoginWithRedirect.mock.calls[0][0]).toEqual({
    appState: { targetUrl: window.location.href },
  });
  expect(store.authError).toBe(undefined);
});

test("authorized when authenticated", async () => {
  mockIsAuthenticated.mockResolvedValue(true);
  mockGetUser.mockResolvedValue({ email_verified: true, ...metadata });
  const store = new UserStore({
    authSettings: testAuthSettings,
    rootStore: mockRootStore,
  });
  await store.authorize(mockHandleUrl);
  expect(store.isAuthorized).toBe(true);
  expect(store.userIsLoading).toBe(false);
});

test("error thrown in firebase token fetch sets authError", async () => {
  mockIsAuthenticated.mockResolvedValue(true);
  mockGetUser.mockResolvedValue({ email_verified: true, ...metadata });
  mockRootStore.firestoreStore.authenticate = vi.fn(() => {
    throw new Error("firebase token error");
  });
  const store = new UserStore({
    authSettings: testAuthSettings,
    rootStore: mockRootStore,
  });
  await store.authorize(mockHandleUrl);
  expect(store.isAuthorized).toBe(false);
  expect(store.authError?.message).toBeDefined();
});

test("redirect to Auth0 when unauthenticated", async () => {
  mockIsAuthenticated.mockResolvedValue(false);
  expect(mockLoginWithRedirect.mock.calls.length).toBe(0);

  const store = new UserStore({
    authSettings: testAuthSettings,
  });
  await store.authorize(mockHandleUrl);
  expect(mockLoginWithRedirect.mock.calls.length).toBe(1);
  expect(mockLoginWithRedirect.mock.calls[0][0]).toEqual({
    appState: { targetUrl: window.location.href },
  });
});

test("does not require email verification", async () => {
  mockGetUser.mockResolvedValue({ email_verified: false, ...metadata });
  mockIsAuthenticated.mockResolvedValue(true);

  const store = new UserStore({
    authSettings: testAuthSettings,
  });
  await store.authorize(mockHandleUrl);
  expect(store.isAuthorized).toBe(true);
  expect(store.userIsLoading).toBe(false);
});

test("handles Auth0 token params", async () => {
  mockHandleRedirectCallback.mockResolvedValue({});
  const auth0LoginParams = "code=123456&state=abcdef";
  const urlWithToken = new URL(window.location.href);
  urlWithToken.search = `?${auth0LoginParams}`;
  window.history.pushState({}, "Test", urlWithToken.href);

  // sanity check on our initial url state
  expect(window.location.href).toMatch(auth0LoginParams);

  const store = new UserStore({
    authSettings: testAuthSettings,
  });
  await store.authorize(mockHandleUrl);

  expect(mockHandleRedirectCallback.mock.calls.length).toBe(1);
  expect(window.location.href).not.toMatch(auth0LoginParams);
});

test("calls target URL handler after redirect", async () => {
  // this needs to be a localhost URL or JSDOM will have problems
  const mockUrl = "http://localhost:3000/some/url";
  mockHandleRedirectCallback.mockResolvedValue({
    appState: { targetUrl: mockUrl },
  });
  const auth0LoginParams = "code=123456&state=abcdef";
  const urlWithToken = new URL(window.location.href);
  urlWithToken.search = `?${auth0LoginParams}`;
  window.history.pushState({}, "Test", urlWithToken.href);

  const store = new UserStore({
    authSettings: testAuthSettings,
  });

  await store.authorize(mockHandleUrl);

  expect(mockHandleUrl).toHaveBeenCalledWith(mockUrl);
});

test("urlQuery error", async () => {
  const targetUrl = "http://localhost:3000/somePage?id=1";
  mockHandleRedirectCallback.mockResolvedValue({ appState: { targetUrl } });

  const auth0LoginParams =
    "error=unauthorized&error_description=no%20access&code=123456&state=abcdef";
  const urlWithToken = new URL(window.location.href);
  urlWithToken.search = `?${auth0LoginParams}`;
  window.history.pushState({}, "Test", urlWithToken.href);

  const store = new UserStore({
    authSettings: testAuthSettings,
  });
  await store.authorize(mockHandleUrl);
  expect(store.authError).toEqual(new Error("no access"));
});

test("redirect to targetUrl after callback", async () => {
  const targetUrl = "http://localhost:3000/somePage?id=1";
  mockHandleRedirectCallback.mockResolvedValue({ appState: { targetUrl } });

  const auth0LoginParams = "code=123456&state=abcdef";
  const urlWithToken = new URL(window.location.href);
  urlWithToken.search = `?${auth0LoginParams}`;
  window.history.pushState({}, "Test", urlWithToken.href);

  const store = new UserStore({
    authSettings: testAuthSettings,
  });
  await store.authorize(mockHandleUrl);
  expect(window.location.href).toBe(targetUrl);
});

test.each(Object.keys(TENANT_CONFIGS))(
  "gets metadata for the user %s",
  async (currentTenantId) => {
    const allowedStates = ["US_MO", "US_CA"];
    const userAppMetadata = {
      [metadataField]: {
        stateCode: currentTenantId,
        allowedStates,
      },
    };
    mockIsAuthenticated.mockResolvedValue(true);
    mockGetUser.mockResolvedValue({
      email_verified: true,
      ...userAppMetadata,
    });
    const store = new UserStore({
      authSettings: testAuthSettings,
    });
    await store.authorize(mockHandleUrl);
    if (currentTenantId === "RECIDIVIZ") {
      expect(store.availableStateCodes).toEqual(["US_CA", "US_MO"]);
      return;
    }

    expect(store.availableStateCodes).toBe(
      TENANT_CONFIGS[currentTenantId as TenantId].availableStateCodes,
    );
    expect(store.stateName).toBe(
      TENANT_CONFIGS[currentTenantId as TenantId].name,
    );
  },
);

test("Error from getTokenSilently redirects to login", async () => {
  expect(mockLoginWithRedirect.mock.calls.length).toBe(0);
  const store = new UserStore({
    authSettings: testAuthSettings,
  });
  await store.authorize(mockHandleUrl);
  mockGetTokenSilently.mockResolvedValue(new Error("Login required"));
  await store.getTokenSilently();
  expect(mockLoginWithRedirect.mock.calls.length).toBe(1);
  expect(mockLoginWithRedirect.mock.calls[0][0]).toEqual({
    appState: { targetUrl: window.location.href },
  });
  expect(store.authError).toBe(undefined);
  expect(store.userIsLoading).toBe(true);
});

describe("getRoutePermission", () => {
  test("when permission is found and is false returns false", async () => {
    mockIsAuthenticated.mockResolvedValue(true);
    const userAppMetadata = {
      [metadataField]: {
        stateCode: "US_MO",
        routes: {
          operations: false,
        },
      },
    };
    mockGetUser.mockResolvedValue({ email_verified: true, ...userAppMetadata });
    const store = new UserStore({
      authSettings: testAuthSettings,
    });
    await store.authorize(mockHandleUrl);
    expect(store.getRoutePermission("operations")).toBe(false);
  });

  test("when permission is found and is true returns true", async () => {
    mockIsAuthenticated.mockResolvedValue(true);
    const userAppMetadata = {
      [metadataField]: {
        stateCode: "US_MO",
        routes: {
          system_prison: true,
        },
      },
    };
    mockGetUser.mockResolvedValue({ email_verified: true, ...userAppMetadata });
    const store = new UserStore({
      authSettings: testAuthSettings,
    });
    await store.authorize(mockHandleUrl);
    expect(store.getRoutePermission("prison")).toBe(true);
  });

  test("when permission is not found returns false", async () => {
    mockIsAuthenticated.mockResolvedValue(true);
    const userAppMetadata = {
      [metadataField]: {
        stateCode: "US_MO",
        routes: {},
      },
    };
    mockGetUser.mockResolvedValue({ email_verified: true, ...userAppMetadata });
    const store = new UserStore({
      authSettings: testAuthSettings,
    });
    await store.authorize(mockHandleUrl);
    expect(store.getRoutePermission("operations")).toBe(false);
  });

  describe("workflows permissions", () => {
    let store: UserStore;
    beforeEach(() => {
      mockIsAuthenticated.mockResolvedValue(true);

      store = new UserStore({
        authSettings: testAuthSettings,
      });
    });

    test("legacy route", async () => {
      const userAppMetadata = {
        [metadataField]: {
          stateCode: "US_MO",
          routes: {
            workflows: true,
          },
        },
      };
      mockGetUser.mockResolvedValue({
        email_verified: true,
        ...userAppMetadata,
      });
      await store.authorize(mockHandleUrl);

      expect(store.getRoutePermission("workflows")).toBeTrue();
    });

    test("supervision and incarceration", async () => {
      const userAppMetadata = {
        [metadataField]: {
          stateCode: "US_MO",
          routes: {
            workflowsSupervision: true,
            workflowsFacilities: true,
          },
        },
      };
      mockGetUser.mockResolvedValue({
        email_verified: true,
        ...userAppMetadata,
      });
      await store.authorize(mockHandleUrl);

      expect(store.getRoutePermission("workflows")).toBeTrue();
    });

    test("supervision only", async () => {
      const userAppMetadata = {
        [metadataField]: {
          stateCode: "US_MO",
          routes: {
            workflowsSupervision: true,
            workflowsFacilities: false,
          },
        },
      };
      mockGetUser.mockResolvedValue({
        email_verified: true,
        ...userAppMetadata,
      });
      await store.authorize(mockHandleUrl);

      expect(store.getRoutePermission("workflows")).toBeTrue();
    });

    test("incarceration only", async () => {
      const userAppMetadata = {
        [metadataField]: {
          stateCode: "US_MO",
          routes: {
            workflowsSupervision: false,
            workflowsFacilities: true,
          },
        },
      };
      mockGetUser.mockResolvedValue({
        email_verified: true,
        ...userAppMetadata,
      });
      await store.authorize(mockHandleUrl);

      expect(store.getRoutePermission("workflows")).toBeTrue();
    });

    test("no access", async () => {
      const userAppMetadata = {
        [metadataField]: {
          stateCode: "US_MO",
          routes: {
            workflowsSupervision: false,
            workflowsFacilities: false,
          },
        },
      };
      mockGetUser.mockResolvedValue({
        email_verified: true,
        ...userAppMetadata,
      });
      await store.authorize(mockHandleUrl);

      expect(store.getRoutePermission("workflows")).toBeFalse();
    });
  });

  test("lantern permissions", async () => {
    mockIsAuthenticated.mockResolvedValue(true);
    const userAppMetadata = {
      [metadataField]: {
        stateCode: "US_MO",
        routes: {
          lantern: true,
        },
      },
    };
    mockGetUser.mockResolvedValue({
      email_verified: true,
      ...userAppMetadata,
    });
    const store = new UserStore({
      authSettings: testAuthSettings,
    });
    await store.authorize(mockHandleUrl);
    expect(store.getRoutePermission("revocations")).toBe(true);
  });
});

describe("isUserAllowedRoute", () => {
  let store: UserStore;
  beforeEach(() => {
    store = new UserStore({
      authSettings: testAuthSettings,
      rootStore: {
        currentTenantId: tenantId,
        firestoreStore: {
          authenticate: vi.fn(),
        },
      } as unknown as typeof RootStore,
    });
  });

  test("when page is allowed for user but not for tenant", async () => {
    mockIsAuthenticated.mockResolvedValue(true);
    const userAppMetadata = {
      [metadataField]: {
        stateCode: tenantId,
        routes: {
          workflows: true,
        },
      },
    };
    TENANT_CONFIGS[tenantId].navigation = { operations: [] };
    mockGetUser.mockResolvedValue({ email_verified: true, ...userAppMetadata });
    await store.authorize(mockHandleUrl);
    expect(store.isUserAllowedRoute("workflows")).toBe(true);
  });

  test("when a page is restricted for the user and the tenant", async () => {
    mockIsAuthenticated.mockResolvedValue(true);
    const userAppMetadata = {
      [metadataField]: {
        stateCode: tenantId,
        routes: {
          operations: false,
        },
      },
    };
    mockGetUser.mockResolvedValue({ email_verified: true, ...userAppMetadata });
    await store.authorize(mockHandleUrl);
    expect(store.isUserAllowedRoute("operations")).toBe(false);
  });
  test("when a page is allowed for the user and the tenant", async () => {
    mockIsAuthenticated.mockResolvedValue(true);
    const userAppMetadata = {
      [metadataField]: {
        stateCode: tenantId,
        routes: {
          operations: true,
        },
      },
    };
    mockGetUser.mockResolvedValue({ email_verified: true, ...userAppMetadata });
    TENANT_CONFIGS[tenantId].navigation = { operations: [] };
    await store.authorize(mockHandleUrl);
    expect(store.isUserAllowedRoute("operations")).toBe(true);
  });

  test.each(UNRESTRICTED_PAGES)(
    "when a page is an unrestricted page",
    async (page) => {
      mockIsAuthenticated.mockResolvedValue(true);
      const userAppMetadata = {
        [metadataField]: {
          stateCode: tenantId,
          routes: {
            operations: true,
          },
        },
      };
      mockGetUser.mockResolvedValue({
        email_verified: true,
        ...userAppMetadata,
      });
      TENANT_CONFIGS[tenantId].navigation = { operations: [] };
      await store.authorize(mockHandleUrl);
      expect(store.isUserAllowedRoute(page)).toBe(true);
    },
  );
});

describe("userAllowedNavigation", () => {
  const stateCode = "US_TN";
  let store: UserStore;

  beforeEach(() => {
    TENANT_CONFIGS[stateCode].navigation = {
      system: [
        PATHWAYS_PAGES.libertyToPrison,
        PATHWAYS_PAGES.prison,
        PATHWAYS_PAGES.supervision,
      ],
      libertyToPrison: [PATHWAYS_SECTIONS.countOverTime],
      prison: [PATHWAYS_SECTIONS.countOverTime],
      supervision: [PATHWAYS_SECTIONS.countOverTime],
      methodology: [DASHBOARD_VIEWS.system],
    };
    store = new UserStore({
      authSettings: testAuthSettings,
      rootStore: {
        currentTenantId: stateCode,
        firestoreStore: {
          authenticate: vi.fn(),
        },
      } as unknown as typeof RootStore,
    });
  });

  test("returns only unrestricted pages when routes is empty", async () => {
    mockIsAuthenticated.mockResolvedValue(true);
    const userAppMetadata = {
      [metadataField]: {
        stateCode,
        routes: {},
      },
    };
    mockGetUser.mockResolvedValue({ email_verified: true, ...userAppMetadata });
    await store.authorize(mockHandleUrl);
    expect(store.userAllowedNavigation).toEqual({
      methodology: [],
    });
  });

  test("returns the navigation where route permission is true", async () => {
    mockIsAuthenticated.mockResolvedValue(true);
    const userAppMetadata = {
      [metadataField]: {
        stateCode,
        routes: {
          system_prison: true,
          system_libertyToPrison: true,
        },
      },
    };
    mockGetUser.mockResolvedValue({ email_verified: true, ...userAppMetadata });
    await store.authorize(mockHandleUrl);
    const expected = {
      methodology: ["system"],
      libertyToPrison: ["countOverTime"],
      prison: ["countOverTime"],
      system: ["libertyToPrison", "prison"],
    };
    expect(store.userAllowedNavigation).toEqual(expected);
  });

  test("returns the navigation removing routes that are not allowed in tenant", async () => {
    mockIsAuthenticated.mockResolvedValue(true);
    const userAppMetadata = {
      [metadataField]: {
        stateCode,
        routes: {
          operations: true,
        },
      },
    };
    TENANT_CONFIGS[stateCode].navigation = { operations: [] };
    mockGetUser.mockResolvedValue({ email_verified: true, ...userAppMetadata });
    await store.authorize(mockHandleUrl);
    const expected = {
      methodology: ["operations"],
      operations: [],
    };
    expect(store.userAllowedNavigation).toEqual(expected);
  });

  test("returns the navigation object without pages where permission is false", async () => {
    mockIsAuthenticated.mockResolvedValue(true);
    const userAppMetadata = {
      [metadataField]: {
        stateCode,
        routes: {
          system_libertyToPrison: true,
          system_prison: false,
        },
      },
    };
    mockGetUser.mockResolvedValue({ email_verified: true, ...userAppMetadata });
    await store.authorize(mockHandleUrl);
    const expected = {
      methodology: ["system"],
      libertyToPrison: ["countOverTime"],
      system: ["libertyToPrison"],
    };
    expect(store.userAllowedNavigation).toEqual(expected);
  });

  test("allows revocations when lantern permission is set", async () => {
    mockIsAuthenticated.mockResolvedValue(true);
    TENANT_CONFIGS[stateCode].navigation = {
      system: [
        PATHWAYS_PAGES.libertyToPrison,
        PATHWAYS_PAGES.prison,
        PATHWAYS_PAGES.supervision,
      ],
      libertyToPrison: [PATHWAYS_SECTIONS.countOverTime],
      prison: [PATHWAYS_SECTIONS.countOverTime],
      supervision: [PATHWAYS_SECTIONS.countOverTime],
      revocations: [],
      methodology: [DASHBOARD_VIEWS.system],
    };
    const userAppMetadata = {
      [metadataField]: {
        stateCode,
        routes: {
          lantern: true,
        },
      },
    };
    mockGetUser.mockResolvedValue({ email_verified: true, ...userAppMetadata });
    await store.authorize(mockHandleUrl);
    const expected = {
      revocations: [],
      methodology: [],
    };
    expect(store.userAllowedNavigation).toEqual(expected);
  });

  test("disallows tasks route with workflows permission but not tasks permission", async () => {
    mockIsAuthenticated.mockResolvedValue(true);
    TENANT_CONFIGS[stateCode].navigation = {
      workflows: ["home", "tasks", "clients", "residents"],
    };
    const userAppMetadata = {
      [metadataField]: {
        stateCode,
        routes: {
          workflowsSupervision: true,
        },
      },
    };
    mockGetUser.mockResolvedValue({ email_verified: true, ...userAppMetadata });
    await store.authorize(mockHandleUrl);
    const expected = {
      workflows: ["home", "clients", "residents"],
      methodology: [],
    };
    expect(store.userAllowedNavigation).toEqual(expected);
  });

  test("disallows workflows home route when tasks is set but workflows is not", async () => {
    mockIsAuthenticated.mockResolvedValue(true);
    TENANT_CONFIGS[stateCode].navigation = {
      workflows: ["home", "tasks", "clients", "residents"],
    };
    const userAppMetadata = {
      [metadataField]: {
        stateCode,
        routes: {
          tasks: true,
        },
      },
    };
    mockGetUser.mockResolvedValue({ email_verified: true, ...userAppMetadata });
    await store.authorize(mockHandleUrl);
    const expected = {
      workflows: ["tasks", "clients", "residents"],
      methodology: [],
    };
    expect(store.userAllowedNavigation).toEqual(expected);
  });

  describe("when the browser isIE11", () => {
    let userAppMetadata;
    beforeEach(() => {
      mockIsIE11.mockReturnValue(true);
      mockIsAuthenticated.mockResolvedValue(true);
      userAppMetadata = {
        [metadataField]: {
          stateCode,
          routes: {
            system_prison: true,
            system_libertyToPrison: true,
            system_supervisionToPrison: true,
          },
        },
      };
      mockGetUser.mockResolvedValue({
        email_verified: true,
        ...userAppMetadata,
      });
      mockGetUser.mockResolvedValue({
        email_verified: true,
        ...userAppMetadata,
      });
    });

    test("returns the navigation object minus the officer chart", async () => {
      TENANT_CONFIGS[stateCode].navigation = {
        system: [
          PATHWAYS_PAGES.libertyToPrison,
          PATHWAYS_PAGES.prison,
          PATHWAYS_PAGES.supervision,
          PATHWAYS_PAGES.supervisionToPrison,
        ],
        libertyToPrison: [PATHWAYS_SECTIONS.countOverTime],
        prison: [PATHWAYS_SECTIONS.countOverTime],
        supervision: [PATHWAYS_SECTIONS.countOverTime],
        supervisionToPrison: [PATHWAYS_SECTIONS.countByOfficer],
        methodology: [DASHBOARD_VIEWS.system],
      };

      await store.authorize(mockHandleUrl);
      const expected = {
        methodology: ["system"],
        libertyToPrison: ["countOverTime"],
        system: ["libertyToPrison", "prison", "supervisionToPrison"],
        prison: ["countOverTime"],
        supervisionToPrison: [],
      };
      expect(store.userAllowedNavigation).toEqual(expected);
    });

    test("it does not error if allowed.supervisionToPrison is undefined", async () => {
      TENANT_CONFIGS[stateCode].navigation = {
        system: [
          PATHWAYS_PAGES.libertyToPrison,
          PATHWAYS_PAGES.prison,
          PATHWAYS_PAGES.supervision,
        ],
        libertyToPrison: [PATHWAYS_SECTIONS.countOverTime],
        prison: [PATHWAYS_SECTIONS.countOverTime],
        supervision: [PATHWAYS_SECTIONS.countOverTime],
        methodology: [DASHBOARD_VIEWS.system],
      };

      await store.authorize(mockHandleUrl);
      const expected = {
        methodology: ["system"],
        libertyToPrison: ["countOverTime"],
        prison: ["countOverTime"],
        system: ["libertyToPrison", "prison"],
      };
      expect(store.userAllowedNavigation).toEqual(expected);
    });
  });
});

test("does not identify authorized users without ID hash", async () => {
  mockIsAuthenticated.mockResolvedValue(true);
  mockGetUser.mockResolvedValue({
    email_verified: true,
    ...metadata,
  });

  const store = new UserStore({
    authSettings: testAuthSettings,
    rootStore: mockRootStore,
  });
  await store.authorize(mockHandleUrl);

  expect(mockRootStore.analyticsStore.identify).not.toHaveBeenCalled();
  expect(Sentry.setUser).toHaveBeenCalledWith(null);
});

test("identifies authorized user if an ID hash is present", async () => {
  mockIsAuthenticated.mockResolvedValue(true);
  const userHash = "hash123abc";
  mockGetUser.mockResolvedValue({
    email_verified: true,
    [metadataField]: { stateCode: tenantId, userHash },
  });

  const store = new UserStore({
    authSettings: testAuthSettings,
    rootStore: mockRootStore,
  });
  await store.authorize(mockHandleUrl);

  expect(mockRootStore.analyticsStore.identify).toHaveBeenCalledWith(userHash);
  expect(Sentry.setUser).toHaveBeenCalledWith({ id: userHash });
});

describe("recidivizAllowedStates", () => {
  test("returns an empty array if user does not have allowedStates metadata", async () => {
    mockIsAuthenticated.mockResolvedValue(true);
    mockGetUser.mockResolvedValue({
      email_verified: true,
      [metadataField]: {
        stateCode: tenantId,
      },
    });
    const store = new UserStore({
      authSettings: testAuthSettings,
      rootStore: mockRootStore,
    });
    await store.authorize(mockHandleUrl);
    expect(store.recidivizAllowedStates).toEqual([]);
  });

  test("returns an array of allowed state codes", async () => {
    const allowedStates = ["US_CA", "US_TN"];
    mockIsAuthenticated.mockResolvedValue(true);
    mockGetUser.mockResolvedValue({
      email_verified: true,
      [metadataField]: { stateCode: "RECIDIVIZ", allowedStates },
    });
    const store = new UserStore({
      authSettings: testAuthSettings,
      rootStore: mockRootStore,
    });
    await store.authorize(mockHandleUrl);
    expect(store.recidivizAllowedStates).toEqual(allowedStates);
  });

  test("only includes states from allowedStates that are also in availableStateCodes", async () => {
    const allowedStates = ["US_CA", "US_TN"];
    mockIsAuthenticated.mockResolvedValue(true);
    mockGetUser.mockResolvedValue({
      email_verified: true,
      stateCode: "US_CA",
      [metadataField]: { stateCode: "US_CA", allowedStates },
    });
    const store = new UserStore({
      authSettings: testAuthSettings,
      rootStore: mockRootStore,
    });
    await store.authorize(mockHandleUrl);
    expect(store.recidivizAllowedStates).toEqual(["US_CA"]);
  });

  test("keeps the order of state codes the same as the tenant config", async () => {
    const allowedStates = ["US_PA", "US_CA"];
    mockIsAuthenticated.mockResolvedValue(true);
    mockGetUser.mockResolvedValue({
      email_verified: true,
      [metadataField]: { stateCode: "RECIDIVIZ", allowedStates },
    });
    const store = new UserStore({
      authSettings: testAuthSettings,
      rootStore: mockRootStore,
    });
    await store.authorize(mockHandleUrl);
    expect(store.recidivizAllowedStates).toEqual(["US_CA", "US_PA"]);
  });

  test("does not filter by allowedStates if in demo mode", async () => {
    const allowedStates = ["US_CA", "US_TN"];

    const isDemoModeMock = isDemoMode as Mock;
    isDemoModeMock.mockReturnValue(true);

    mockIsAuthenticated.mockResolvedValue(true);
    mockGetUser.mockResolvedValue({
      email_verified: true,
      [metadataField]: { stateCode: "RECIDIVIZ", allowedStates },
    });
    const store = new UserStore({
      authSettings: testAuthSettings,
      rootStore: mockRootStore,
    });
    await store.authorize(mockHandleUrl);
    expect(store.recidivizAllowedStates).toEqual(
      TENANT_CONFIGS.RECIDIVIZ.availableStateCodes,
    );
  });
});

describe("feature variants", () => {
  let store: UserStore;

  type RawFeatureVariants = Partial<
    Record<
      FeatureVariant,
      {
        activeDate?: string;
        variant?: string;
        activeTenants?: string[];
      }
    >
  >;

  function getMockUserObject({
    featureVariants,
    demoModeFeatureVariants,
    stateCode = "US_XX",
  }: {
    featureVariants?: RawFeatureVariants;
    demoModeFeatureVariants?: RawFeatureVariants;
    stateCode?: string;
  } = {}): User {
    return {
      email: "test@example.gov",
      [`${METADATA_NAMESPACE}app_metadata`]: {
        stateCode,
        featureVariants,
        demoModeFeatureVariants,
      },
    };
  }

  beforeEach(() => {
    vi.useFakeTimers();
    sessionStorage.clear();
    store = new UserStore({
      rootStore: {
        currentTenantId: tenantId,
        tenantStore: {
          tenantFeatureVariants: {},
        },
      } as unknown as typeof RootStore,
    });
    runInAction(() => {
      store.isAuthorized = true;
      store.userIsLoading = false;
    });
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  test("Does not throw error on failed logins", () => {
    runInAction(() => {
      getMockUserObject({});
      store.isAuthorized = false;
    });

    expect(store.activeFeatureVariants).toEqual({});
  });

  test("feature variants active by default for Recidiviz users", async () => {
    runInAction(() => {
      store.user = getMockUserObject({ stateCode: "RECIDIVIZ" });
    });

    expect(store.activeFeatureVariants).toMatchInlineSnapshot(`
      {
        "TEST": {},
        "actionStrategies": {},
        "caseNoteSearch": {},
        "disableSnoozeSlider": {},
        "editCountyFields": {},
        "formRevertButton": {},
        "hideDenialRevert": {},
        "insightsLeadershipPageAllDistricts": {},
        "insightsOnboarding": {},
        "insightsStaffUsage": {},
        "mandatoryMinimum": {},
        "offenseOverrideControls": {},
        "protectiveFactors": {},
        "snoozeCompanions": {},
        "supervisionUnrestrictedSearch": {},
        "supervisorHomepageVitals": {},
        "supervisorHomepageWorkflows": {},
        "usAzFacilitySearch": {},
        "usCaEnableSMS": {},
        "usIaEarlyDischargeCustomizations": {},
        "usIaEarlyDischargeForms": {},
        "usIdCRCFacilitySearch": {},
        "usIdCaseManagerSearch": {},
        "usMeCaseNoteSnooze": {},
        "usMoOverdueRHPilot": {},
        "usPaSpecialCircumstances": {},
        "usTnCompliantReporting2025Policy": {},
        "usTnExpiration": {},
        "usTnExpirationSubmitToTomis": {},
        "usTnInitialClassification": {},
        "usTnSuspensionOfDirectSupervision": {},
        "usTnTEPENotesForAll": {},
        "workflowsSupervisorSearch": {},
        "zeroGrantsFlag": {},
      }
    `);
  });

  test("recidiviz user with feature variant defined", async () => {
    runInAction(() => {
      store.user = getMockUserObject({
        featureVariants: { EXTRA_FV: {} } as any,
        stateCode: "RECIDIVIZ",
      });
    });

    expect(store.activeFeatureVariants).toMatchInlineSnapshot(`
      {
        "EXTRA_FV": {},
        "TEST": {},
        "actionStrategies": {},
        "caseNoteSearch": {},
        "disableSnoozeSlider": {},
        "editCountyFields": {},
        "formRevertButton": {},
        "hideDenialRevert": {},
        "insightsLeadershipPageAllDistricts": {},
        "insightsOnboarding": {},
        "insightsStaffUsage": {},
        "mandatoryMinimum": {},
        "offenseOverrideControls": {},
        "protectiveFactors": {},
        "snoozeCompanions": {},
        "supervisionUnrestrictedSearch": {},
        "supervisorHomepageVitals": {},
        "supervisorHomepageWorkflows": {},
        "usAzFacilitySearch": {},
        "usCaEnableSMS": {},
        "usIaEarlyDischargeCustomizations": {},
        "usIaEarlyDischargeForms": {},
        "usIdCRCFacilitySearch": {},
        "usIdCaseManagerSearch": {},
        "usMeCaseNoteSnooze": {},
        "usMoOverdueRHPilot": {},
        "usPaSpecialCircumstances": {},
        "usTnCompliantReporting2025Policy": {},
        "usTnExpiration": {},
        "usTnExpirationSubmitToTomis": {},
        "usTnInitialClassification": {},
        "usTnSuspensionOfDirectSupervision": {},
        "usTnTEPENotesForAll": {},
        "workflowsSupervisorSearch": {},
        "zeroGrantsFlag": {},
      }
    `);
  });

  test("recidiviz user with feature variant disabled", async () => {
    runInAction(() => {
      store.user = getMockUserObject({
        featureVariants: { TEST: { activeDate: "9999" } },
        stateCode: "RECIDIVIZ",
      });
    });

    expect(store.activeFeatureVariants).toMatchInlineSnapshot(`
      {
        "actionStrategies": {},
        "caseNoteSearch": {},
        "disableSnoozeSlider": {},
        "editCountyFields": {},
        "formRevertButton": {},
        "hideDenialRevert": {},
        "insightsLeadershipPageAllDistricts": {},
        "insightsOnboarding": {},
        "insightsStaffUsage": {},
        "mandatoryMinimum": {},
        "offenseOverrideControls": {},
        "protectiveFactors": {},
        "snoozeCompanions": {},
        "supervisionUnrestrictedSearch": {},
        "supervisorHomepageVitals": {},
        "supervisorHomepageWorkflows": {},
        "usAzFacilitySearch": {},
        "usCaEnableSMS": {},
        "usIaEarlyDischargeCustomizations": {},
        "usIaEarlyDischargeForms": {},
        "usIdCRCFacilitySearch": {},
        "usIdCaseManagerSearch": {},
        "usMeCaseNoteSnooze": {},
        "usMoOverdueRHPilot": {},
        "usPaSpecialCircumstances": {},
        "usTnCompliantReporting2025Policy": {},
        "usTnExpiration": {},
        "usTnExpirationSubmitToTomis": {},
        "usTnInitialClassification": {},
        "usTnSuspensionOfDirectSupervision": {},
        "usTnTEPENotesForAll": {},
        "workflowsSupervisorSearch": {},
        "zeroGrantsFlag": {},
      }
    `);
  });

  test("no feature variants", async () => {
    runInAction(() => {
      store.user = getMockUserObject();
    });

    expect(store.activeFeatureVariants).toEqual({});
  });

  test("variant with no active date", async () => {
    runInAction(() => {
      store.user = getMockUserObject({
        featureVariants: { TEST: { variant: "a" } },
      });
    });

    expect(store.activeFeatureVariants).toEqual({
      TEST: { variant: "a" },
    });
  });

  test("variant with past active date", async () => {
    runInAction(() => {
      store.user = getMockUserObject({
        featureVariants: {
          TEST: {
            activeDate: add(new Date(), { seconds: -1 }).toISOString(),
          },
        },
      });
    });

    expect(store.activeFeatureVariants).toEqual({
      TEST: {},
    });
  });

  test("variant with future active date", async () => {
    runInAction(() => {
      store.user = getMockUserObject({
        featureVariants: {
          TEST: {
            activeDate: add(new Date(), { seconds: 1 }).toISOString(),
          },
        },
      });
    });
    expect(store.activeFeatureVariants).toEqual({});

    // We check once a second to see if the feature variant is active now, and since we set it to be
    // active 1 second in the future, the feature variant should become active if we advance time by 1
    // second.
    vi.advanceTimersByTime(1000);

    expect(store.activeFeatureVariants).toEqual({
      TEST: {},
    });
  });

  test("variant with active tenant equal to current tenant", async () => {
    runInAction(() => {
      store.user = getMockUserObject({
        featureVariants: {
          TEST: {
            activeTenants: [tenantId],
          },
        },
      });
    });

    expect(store.activeFeatureVariants).toEqual({
      TEST: {},
    });
  });

  test("variant with active tenant not equal to current tenant", async () => {
    runInAction(() => {
      store.user = getMockUserObject({
        featureVariants: {
          TEST: {
            activeTenants: ["US_XX"],
          },
        },
      });
    });

    expect(store.activeFeatureVariants).toEqual({});
  });

  test("demo mode with demo variant defined", () => {
    const isDemoModeMock = isDemoMode as Mock;
    isDemoModeMock.mockReturnValue(true);

    runInAction(() => {
      store.user = getMockUserObject({
        featureVariants: { TEST: { variant: "a" } },
        demoModeFeatureVariants: {},
      });
    });

    expect(store.activeFeatureVariants).toEqual({});
  });

  test("demo mode with demo variant not defined", () => {
    const isDemoModeMock = vi.mocked(isDemoMode);
    isDemoModeMock.mockReturnValue(true);

    runInAction(() => {
      store.user = getMockUserObject({ featureVariants: { TEST: {} } });
    });

    expect(store.activeFeatureVariants).toEqual({
      TEST: {},
    });
  });

  test("non-demo mode with demo variant defined", () => {
    runInAction(() => {
      store.user = getMockUserObject({
        demoModeFeatureVariants: {
          TEST: {},
        },
      });
    });

    expect(store.activeFeatureVariants).toEqual({});
  });

  test("tenantFeatureVariants are applied", () => {
    store = new UserStore({
      rootStore: {
        currentTenantId: "US_XX",
        tenantStore: {
          tenantFeatureVariants: {
            TENANTFV: {},
          },
        },
      } as unknown as typeof RootStore,
    });
    runInAction(() => {
      store.user = getMockUserObject({});
      store.isAuthorized = true;
      store.userIsLoading = false;
    });

    expect(store.activeFeatureVariants).toEqual({
      TENANTFV: {},
    });
  });

  test("setFeatureVariantOverride sets and persists an override", () => {
    runInAction(() => {
      store.user = getMockUserObject({ stateCode: "RECIDIVIZ" });
    });
    store.setFeatureVariantOverride("TEST", true);
    expect(store.getFeatureVariantOverrides()).toEqual({ TEST: true });
    expect(sessionStorage.getItem(SESSION_FEATURE_VARIANT_OVERRIDES)).toContain(
      '"TEST":true',
    );
  });

  test("setFeatureVariantOverride toggles override off", () => {
    runInAction(() => {
      store.user = getMockUserObject({ stateCode: "RECIDIVIZ" });
    });
    store.setFeatureVariantOverride("TEST", true);
    store.setFeatureVariantOverride("TEST", false);
    expect(store.getFeatureVariantOverrides()).toEqual({ TEST: false });
    expect(sessionStorage.getItem(SESSION_FEATURE_VARIANT_OVERRIDES)).toContain(
      '"TEST":false',
    );
  });

  test("getFeatureVariantOverrides returns empty object if nothing set", () => {
    expect(store.getFeatureVariantOverrides()).toEqual({});
  });

  test("activeFeatureVariants toggles feature when override is set", () => {
    runInAction(() => {
      store.user = getMockUserObject({
        featureVariants: { TEST: {} },
        stateCode: "RECIDIVIZ",
      });
    });
    expect(store.activeFeatureVariants["TEST"]).toEqual({});

    // Toggle FV off
    store.setFeatureVariantOverride("TEST", true);
    expect(store.activeFeatureVariants["TEST"]).toBeUndefined();

    // Toggle FV back on
    store.setFeatureVariantOverride("TEST", false);
    expect(store.activeFeatureVariants["TEST"]).toEqual({});
  });

  test("activeFeatureVariants toggles feature on if not present", () => {
    runInAction(() => {
      store.user = getMockUserObject({
        featureVariants: {},
        stateCode: "RECIDIVIZ",
      });
    });
    store.setFeatureVariantOverride("EXTRA_FV" as any, true);
    expect((store.activeFeatureVariants as any)["EXTRA_FV"]).toEqual({});

    store.setFeatureVariantOverride("EXTRA_FV" as any, false);
    expect((store.activeFeatureVariants as any)["EXTRA_FV"]).toBeUndefined();
  });

  test("non-Recidiviz user cannot set a feature variant override", () => {
    runInAction(() => {
      store.user = getMockUserObject({
        stateCode: "US_XX",
      });
    });
    store.setFeatureVariantOverride("TEST", true);
    expect(store.getFeatureVariantOverrides()).toEqual({});
    expect(
      sessionStorage.getItem(SESSION_FEATURE_VARIANT_OVERRIDES),
    ).toBeNull();
  });

  test("loads feature variant overrides from session storage on initialization", () => {
    // Set some overrides in sessionStorage
    const overrides = { TEST: true, EXTRA_FV: false };
    sessionStorage.setItem(
      SESSION_FEATURE_VARIANT_OVERRIDES,
      JSON.stringify(overrides),
    );

    // Create a new UserStore instance
    const newStore = new UserStore({
      rootStore: {
        currentTenantId: tenantId,
        tenantStore: {
          tenantFeatureVariants: {},
        },
      } as unknown as typeof RootStore,
    });
    // Ensure the overrides are loaded into the new store
    expect(newStore.getFeatureVariantOverrides()).toEqual(overrides);
  });
});

describe("impersonateUser", () => {
  let store: UserStore;
  beforeEach(() => {
    mockIsAuthenticated.mockResolvedValue(true);
    store = new UserStore({
      authSettings: testAuthSettings,
      rootStore: mockRootStore,
    });
  });

  test("authenticates recidiviz user", async () => {
    const allowedStates = ["US_TN", "US_CA"];
    const impersonatedState = "us_tn";
    const impersonatedEmail = "impersonatedEmail@doc.gov";
    mockGetUser.mockResolvedValue({
      email_verified: true,
      [metadataField]: { stateCode: "recidiviz", allowedStates },
    });
    mockGetTokenSilently.mockReturnValue("token123");
    mockFetchImpersonatedUserAppMetadata.mockResolvedValue({
      stateCode: impersonatedState,
    });

    await store.authorize(mockHandleUrl);
    await store.impersonateUser(impersonatedEmail);

    expect(store.impersonationError).toBeUndefined();
    expect(store.rootStore?.firestoreStore.authenticate).toHaveBeenCalled();
    expect(store.user).toEqual({
      email: impersonatedEmail,
      email_verified: true,
      given_name: "Impersonated User",
      [metadataField]: {
        stateCode: impersonatedState,
        allowedStates: [impersonatedState],
      },
      impersonator: true,
      name: "Impersonated User",
      stateCode: impersonatedState,
    });
  });

  test("does not authenticate non-recidiviz user", async () => {
    const user: User = {
      email_verified: true,
      [metadataField]: { stateCode: "csg" },
    };
    mockGetUser.mockResolvedValue(user);

    await store.authorize(mockHandleUrl);
    await store.impersonateUser("impersonatedEmail@doc.gov");

    expect(store.impersonationError).toEqual(
      new Error("Impersonation is only allowed for Recidiviz users"),
    );
    expect(store.user).toEqual(user);
  });

  test("authenticates recidiviz user who is already impersonating another user", async () => {
    const allowedStates = ["US_TN", "US_CA"];
    const impersonatedState = "us_tn";
    const impersonatedEmail = "impersonatedEmail@doc.gov";
    const secondImpersonatedEmail = "secondImpersonatedEmail@doc.gov";
    mockGetUser.mockResolvedValue({
      email_verified: true,
      [metadataField]: { stateCode: "recidiviz", allowedStates },
    });
    mockGetTokenSilently.mockReturnValue("token123");
    mockFetchImpersonatedUserAppMetadata.mockResolvedValue({
      stateCode: impersonatedState,
    });

    await store.authorize(mockHandleUrl);
    await store.impersonateUser(impersonatedEmail);
    await store.impersonateUser(secondImpersonatedEmail);

    expect(store.impersonationError).toBeUndefined();
    expect(store.rootStore?.firestoreStore.authenticate).toHaveBeenCalled();
    expect(store.user).toEqual({
      email: secondImpersonatedEmail,
      email_verified: true,
      given_name: "Impersonated User",
      [metadataField]: {
        stateCode: impersonatedState,
        allowedStates: [impersonatedState],
      },
      impersonator: true,
      name: "Impersonated User",
      stateCode: impersonatedState,
    });
  });
});
