// Recidiviz - a data platform for criminal justice reform
// Copyright (C) 2021 Recidiviz, Inc.
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
import createAuth0Client from "@auth0/auth0-spa-js";

import { ERROR_MESSAGES } from "../../constants/errorMessages";
import {
  PATHWAYS_PAGES,
  PATHWAYS_SECTIONS,
  PATHWAYS_VIEWS,
} from "../../core/views";
import tenants from "../../tenants";
import RootStore from "..";
import { TenantId } from "../types";
import UserStore from "../UserStore";

jest.mock("@auth0/auth0-spa-js");

const METADATA_NAMESPACE = process.env.REACT_APP_METADATA_NAMESPACE;

const mockCreateAuth0Client = createAuth0Client as jest.Mock;
const mockGetUser = jest.fn();
const mockHandleRedirectCallback = jest.fn();
const mockIsAuthenticated = jest.fn();
const mockLoginWithRedirect = jest.fn();
const mockGetTokenSilently = jest.fn();

const tenantId = "US_MO";
const metadataField = `${METADATA_NAMESPACE}app_metadata`;
const metadata = { [metadataField]: { state_code: tenantId } };
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
});

afterEach(() => {
  jest.resetAllMocks();
});

test("authorization immediately pending", () => {
  const store = new UserStore({});
  expect(store.isAuthorized).toBe(false);
  expect(store.userIsLoading).toBe(true);
});

test("authorize requires Auth0 client settings", async () => {
  const store = new UserStore({});
  await store.authorize();
  const error = store.authError;
  expect(error?.message).toMatch(ERROR_MESSAGES.auth0Configuration);
});

test("error thrown in authorize sets authError", async () => {
  mockCreateAuth0Client.mockResolvedValue("INALID_AUTH_OBJECT");
  const store = new UserStore({
    authSettings: testAuthSettings,
  });
  await store.authorize();
  const error = store.authError;
  expect(error?.message).toBeDefined();
});

test("Invalid state thrown in authorize redirects to login", async () => {
  mockHandleRedirectCallback.mockResolvedValue(new Error("Invalid state"));
  expect(mockLoginWithRedirect.mock.calls.length).toBe(0);

  const store = new UserStore({
    authSettings: testAuthSettings,
  });
  await store.authorize();

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
  });
  await store.authorize();
  expect(store.isAuthorized).toBe(true);
  expect(store.userIsLoading).toBe(false);
});

test("redirect to Auth0 when unauthenticated", async () => {
  mockIsAuthenticated.mockResolvedValue(false);
  expect(mockLoginWithRedirect.mock.calls.length).toBe(0);

  const store = new UserStore({
    authSettings: testAuthSettings,
  });
  await store.authorize();
  expect(mockLoginWithRedirect.mock.calls.length).toBe(1);
  expect(mockLoginWithRedirect.mock.calls[0][0]).toEqual({
    appState: { targetUrl: window.location.href },
  });
});

test("requires email verification", async () => {
  mockGetUser.mockResolvedValue({ email_verified: false, ...metadata });
  mockIsAuthenticated.mockResolvedValue(true);

  const store = new UserStore({
    authSettings: testAuthSettings,
  });
  await store.authorize();
  expect(store.isAuthorized).toBe(false);
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
  await store.authorize();

  expect(mockHandleRedirectCallback.mock.calls.length).toBe(1);
  expect(window.location.href).not.toMatch(auth0LoginParams);
});

test("urlQuery error", async () => {
  const targetUrl = "http://localhost/somePage?id=1";
  mockHandleRedirectCallback.mockResolvedValue({ appState: { targetUrl } });

  const auth0LoginParams =
    "error=unauthorized&error_description=no%20access&code=123456&state=abcdef";
  const urlWithToken = new URL(window.location.href);
  urlWithToken.search = `?${auth0LoginParams}`;
  window.history.pushState({}, "Test", urlWithToken.href);

  const store = new UserStore({
    authSettings: testAuthSettings,
  });
  await store.authorize();
  expect(store.authError).toEqual(new Error("no access"));
});

test("redirect to targetUrl after callback", async () => {
  const targetUrl = "http://localhost/somePage?id=1";
  mockHandleRedirectCallback.mockResolvedValue({ appState: { targetUrl } });

  const auth0LoginParams = "code=123456&state=abcdef";
  const urlWithToken = new URL(window.location.href);
  urlWithToken.search = `?${auth0LoginParams}`;
  window.history.pushState({}, "Test", urlWithToken.href);

  const store = new UserStore({
    authSettings: testAuthSettings,
  });
  await store.authorize();
  expect(window.location.href).toBe(targetUrl);
});

test.each(Object.keys(tenants))(
  "gets metadata for the user %s",
  async (currentTenantId) => {
    const tenantMetadata = { [metadataField]: { state_code: currentTenantId } };
    mockIsAuthenticated.mockResolvedValue(true);
    mockGetUser.mockResolvedValue({
      email_verified: true,
      ...tenantMetadata,
    });

    const store = new UserStore({
      authSettings: testAuthSettings,
    });
    await store.authorize();
    expect(store.availableStateCodes).toBe(
      tenants[currentTenantId as TenantId].availableStateCodes
    );
    expect(store.stateName).toBe(tenants[currentTenantId as TenantId].name);
  }
);

test("Error from getTokenSilently redirects to login", async () => {
  expect(mockLoginWithRedirect.mock.calls.length).toBe(0);
  const store = new UserStore({
    authSettings: testAuthSettings,
  });
  await store.authorize();
  mockGetTokenSilently.mockResolvedValue(new Error("Login required"));
  await store.getTokenSilently();
  expect(mockLoginWithRedirect.mock.calls.length).toBe(1);
  expect(mockLoginWithRedirect.mock.calls[0][0]).toEqual({
    appState: { targetUrl: window.location.href },
  });
  expect(store.authError).toBe(undefined);
});

describe("getRoutePermission", () => {
  test("when permission is found and is false returns false", async () => {
    mockIsAuthenticated.mockResolvedValue(true);
    const tenantMetadata = {
      [metadataField]: {
        state_code: "US_MO",
        routes: {
          operations: false,
        },
      },
    };
    mockGetUser.mockResolvedValue({ email_verified: true, ...tenantMetadata });
    const store = new UserStore({
      authSettings: testAuthSettings,
    });
    await store.authorize();
    expect(store.getRoutePermission("operations")).toBe(false);
  });

  test("when permission is found and is true returns true", async () => {
    mockIsAuthenticated.mockResolvedValue(true);
    const tenantMetadata = {
      [metadataField]: {
        state_code: "US_MO",
        routes: {
          community_practices: true,
        },
      },
    };
    mockGetUser.mockResolvedValue({ email_verified: true, ...tenantMetadata });
    const store = new UserStore({
      authSettings: testAuthSettings,
    });
    await store.authorize();
    expect(store.getRoutePermission("practices")).toBe(true);
  });

  test("when permission is not found returns false", async () => {
    mockIsAuthenticated.mockResolvedValue(true);
    const tenantMetadata = {
      [metadataField]: {
        state_code: "US_MO",
        routes: {},
      },
    };
    mockGetUser.mockResolvedValue({ email_verified: true, ...tenantMetadata });
    const store = new UserStore({
      authSettings: testAuthSettings,
    });
    await store.authorize();
    expect(store.getRoutePermission("operations")).toBe(false);
  });
});

describe("canAccessRestrictedPage", () => {
  test("when page is not in pagesWithRestrictions", async () => {
    mockIsAuthenticated.mockResolvedValue(true);
    const tenantMetadata = {
      [metadataField]: {
        state_code: tenantId,
      },
    };
    mockGetUser.mockResolvedValue({ email_verified: true, ...tenantMetadata });
    const store = new UserStore({
      authSettings: testAuthSettings,
      rootStore: {
        currentTenantId: tenantId,
      } as typeof RootStore,
    });
    await store.authorize();
    expect(store.canAccessRestrictedPage("anyBogusPage")).toBe(true);
  });

  test("when page is restricted and permission is false", async () => {
    mockIsAuthenticated.mockResolvedValue(true);
    const tenantMetadata = {
      [metadataField]: {
        state_code: tenantId,
        routes: {
          operations: false,
        },
      },
    };
    mockGetUser.mockResolvedValue({ email_verified: true, ...tenantMetadata });
    const store = new UserStore({
      authSettings: testAuthSettings,
      rootStore: {
        currentTenantId: tenantId,
      } as typeof RootStore,
    });
    await store.authorize();

    tenants[tenantId].pagesWithRestrictions = ["operations"];
    expect(store.canAccessRestrictedPage("operations")).toBe(false);
  });

  test("when page is restricted and permission is true", async () => {
    mockIsAuthenticated.mockResolvedValue(true);
    const tenantMetadata = {
      [metadataField]: {
        state_code: tenantId,
        routes: {
          operations: true,
        },
      },
    };
    mockGetUser.mockResolvedValue({ email_verified: true, ...tenantMetadata });
    const store = new UserStore({
      authSettings: testAuthSettings,
      rootStore: {
        currentTenantId: tenantId,
      } as typeof RootStore,
    });
    await store.authorize();

    tenants[tenantId].pagesWithRestrictions = ["operations"];
    expect(store.canAccessRestrictedPage("operations")).toBe(true);
  });
});

describe("userAllowedNavigation", () => {
  const stateCode = "US_TN";

  beforeEach(() => {
    tenants[stateCode].pagesWithRestrictions = [
      PATHWAYS_PAGES.prison,
      PATHWAYS_PAGES.supervision,
    ];
    tenants[stateCode].navigation = {
      system: [
        PATHWAYS_PAGES.libertyToPrison,
        PATHWAYS_PAGES.prison,
        PATHWAYS_PAGES.supervision,
      ],
      libertyToPrison: [PATHWAYS_SECTIONS.countOverTime],
      prison: [PATHWAYS_SECTIONS.countOverTime],
      supervision: [PATHWAYS_SECTIONS.countOverTime],
      "id-methodology": [PATHWAYS_VIEWS.system],
      methodology: [],
    };
  });

  test("returns the navigation object minus pagesWithRestrictions when user routes is empty", async () => {
    mockIsAuthenticated.mockResolvedValue(true);
    const tenantMetadata = {
      [metadataField]: {
        state_code: stateCode,
        routes: {},
      },
    };
    mockGetUser.mockResolvedValue({ email_verified: true, ...tenantMetadata });
    const store = new UserStore({
      authSettings: testAuthSettings,
      rootStore: {
        currentTenantId: stateCode,
      } as typeof RootStore,
    });
    await store.authorize();
    const expected = {
      "id-methodology": ["system"],
      libertyToPrison: ["countOverTime"],
      methodology: [],
      system: ["libertyToPrison"],
    };
    expect(store.userAllowedNavigation).toEqual(expected);
  });

  test("returns the navigation object minus pagesWithRestrictions plus pages where route permission is true", async () => {
    mockIsAuthenticated.mockResolvedValue(true);
    const tenantMetadata = {
      [metadataField]: {
        state_code: stateCode,
        routes: {
          system_prison: true,
        },
      },
    };
    mockGetUser.mockResolvedValue({ email_verified: true, ...tenantMetadata });
    const store = new UserStore({
      authSettings: testAuthSettings,
      rootStore: {
        currentTenantId: stateCode,
      } as typeof RootStore,
    });
    await store.authorize();
    const expected = {
      "id-methodology": ["system"],
      libertyToPrison: ["countOverTime"],
      prison: ["countOverTime"],
      methodology: [],
      system: ["libertyToPrison", "prison"],
    };
    expect(store.userAllowedNavigation).toEqual(expected);
  });

  test("returns the navigation object minus restricted page when page permission is false", async () => {
    mockIsAuthenticated.mockResolvedValue(true);
    const tenantMetadata = {
      [metadataField]: {
        state_code: stateCode,
        routes: {
          system_prison: false,
        },
      },
    };
    mockGetUser.mockResolvedValue({ email_verified: true, ...tenantMetadata });
    const store = new UserStore({
      authSettings: testAuthSettings,
      rootStore: {
        currentTenantId: stateCode,
      } as typeof RootStore,
    });
    await store.authorize();
    const expected = {
      "id-methodology": ["system"],
      libertyToPrison: ["countOverTime"],
      methodology: [],
      system: ["libertyToPrison"],
    };
    expect(store.userAllowedNavigation).toEqual(expected);
  });

  test("returns the navigation object when pagesWithRestrictions is empty", async () => {
    tenants[stateCode].pagesWithRestrictions = [];

    mockIsAuthenticated.mockResolvedValue(true);
    const tenantMetadata = {
      [metadataField]: {
        state_code: stateCode,
        routes: {
          system_prison: false,
        },
      },
    };
    mockGetUser.mockResolvedValue({ email_verified: true, ...tenantMetadata });
    const store = new UserStore({
      authSettings: testAuthSettings,
      rootStore: {
        currentTenantId: stateCode,
      } as typeof RootStore,
    });
    await store.authorize();
    expect(store.userAllowedNavigation).toEqual(tenants[stateCode].navigation);
  });
});
