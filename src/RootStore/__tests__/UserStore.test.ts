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
import * as Sentry from "@sentry/react";

import { ERROR_MESSAGES } from "../../constants/errorMessages";
import {
  DASHBOARD_VIEWS,
  PATHWAYS_PAGES,
  PATHWAYS_SECTIONS,
} from "../../core/views";
import tenants from "../../tenants";
import isIE11 from "../../utils/isIE11";
import RootStore from "..";
import { TenantId } from "../types";
import UserStore from "../UserStore";

jest.mock("@auth0/auth0-spa-js");
jest.mock("@sentry/react");
jest.mock("firebase/firestore");
jest.mock("../../utils/isIE11");

const METADATA_NAMESPACE = process.env.REACT_APP_METADATA_NAMESPACE;

const mockCreateAuth0Client = createAuth0Client as jest.Mock;
const mockGetUser = jest.fn();
const mockHandleRedirectCallback = jest.fn();
const mockIsAuthenticated = jest.fn();
const mockLoginWithRedirect = jest.fn();
const mockGetTokenSilently = jest.fn();

const mockHandleUrl = jest.fn();
const mockIsIE11 = isIE11 as jest.Mock<boolean>;

const mockRootStore = {
  analyticsStore: {
    identify: jest.fn(),
  },
  firestoreStore: {
    authenticate: jest.fn(),
    authenticateImpersonatedUser: jest.fn(),
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
  mockRootStore.firestoreStore.authenticate = jest.fn(() => {
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
  const mockUrl = "http://localhost/some/url";
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
  await store.authorize(mockHandleUrl);
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
  await store.authorize(mockHandleUrl);
  expect(window.location.href).toBe(targetUrl);
});

test.each(Object.keys(tenants))(
  "gets metadata for the user %s",
  async (currentTenantId) => {
    const allowedStates = ["US_CA", "US_MO"];
    const tenantMetadata = {
      [metadataField]: {
        stateCode: currentTenantId,
        allowedStates,
      },
    };
    mockIsAuthenticated.mockResolvedValue(true);
    mockGetUser.mockResolvedValue({
      email_verified: true,
      ...tenantMetadata,
    });
    const store = new UserStore({
      authSettings: testAuthSettings,
    });
    await store.authorize(mockHandleUrl);
    if (currentTenantId === "RECIDIVIZ") {
      expect(store.availableStateCodes).toEqual(allowedStates);
      return;
    }

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
    const tenantMetadata = {
      [metadataField]: {
        stateCode: "US_MO",
        routes: {
          operations: false,
        },
      },
    };
    mockGetUser.mockResolvedValue({ email_verified: true, ...tenantMetadata });
    const store = new UserStore({
      authSettings: testAuthSettings,
    });
    await store.authorize(mockHandleUrl);
    expect(store.getRoutePermission("operations")).toBe(false);
  });

  test("when permission is found and is true returns true", async () => {
    mockIsAuthenticated.mockResolvedValue(true);
    const tenantMetadata = {
      [metadataField]: {
        stateCode: "US_MO",
        routes: {
          system_prison: true,
        },
      },
    };
    mockGetUser.mockResolvedValue({ email_verified: true, ...tenantMetadata });
    const store = new UserStore({
      authSettings: testAuthSettings,
    });
    await store.authorize(mockHandleUrl);
    expect(store.getRoutePermission("prison")).toBe(true);
  });

  test("when permission is not found returns false", async () => {
    mockIsAuthenticated.mockResolvedValue(true);
    const tenantMetadata = {
      [metadataField]: {
        stateCode: "US_MO",
        routes: {},
      },
    };
    mockGetUser.mockResolvedValue({ email_verified: true, ...tenantMetadata });
    const store = new UserStore({
      authSettings: testAuthSettings,
    });
    await store.authorize(mockHandleUrl);
    expect(store.getRoutePermission("operations")).toBe(false);
  });
});

describe("canAccessRestrictedPage", () => {
  test("when page is not in pagesWithRestrictions", async () => {
    mockIsAuthenticated.mockResolvedValue(true);
    const tenantMetadata = {
      [metadataField]: {
        stateCode: tenantId,
      },
    };
    mockGetUser.mockResolvedValue({ email_verified: true, ...tenantMetadata });
    const store = new UserStore({
      authSettings: testAuthSettings,
      rootStore: {
        currentTenantId: tenantId,
        firestoreStore: {
          authenticate: jest.fn(),
        },
      } as unknown as typeof RootStore,
    });
    await store.authorize(mockHandleUrl);
    expect(store.canAccessRestrictedPage("anyBogusPage")).toBe(true);
  });

  test("when page is restricted and permission is false", async () => {
    mockIsAuthenticated.mockResolvedValue(true);
    const tenantMetadata = {
      [metadataField]: {
        stateCode: tenantId,
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
    await store.authorize(mockHandleUrl);

    tenants[tenantId].pagesWithRestrictions = ["operations"];
    expect(store.canAccessRestrictedPage("operations")).toBe(false);
  });

  test("when page is restricted and permission is true", async () => {
    mockIsAuthenticated.mockResolvedValue(true);
    const tenantMetadata = {
      [metadataField]: {
        stateCode: tenantId,
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
        firestoreStore: {
          authenticate: jest.fn(),
        },
      } as unknown as typeof RootStore,
    });
    await store.authorize(mockHandleUrl);

    tenants[tenantId].pagesWithRestrictions = ["operations"];
    expect(store.canAccessRestrictedPage("operations")).toBe(true);
  });
});

describe("userAllowedNavigation", () => {
  const stateCode = "US_TN";
  let store: UserStore;

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
      "id-methodology": [DASHBOARD_VIEWS.system],
    };
    store = new UserStore({
      authSettings: testAuthSettings,
      rootStore: {
        currentTenantId: stateCode,
        firestoreStore: {
          authenticate: jest.fn(),
        },
      } as unknown as typeof RootStore,
    });
  });

  test("returns the navigation object minus pagesWithRestrictions when user routes is empty", async () => {
    mockIsAuthenticated.mockResolvedValue(true);
    const tenantMetadata = {
      [metadataField]: {
        stateCode,
        routes: {},
      },
    };
    mockGetUser.mockResolvedValue({ email_verified: true, ...tenantMetadata });
    await store.authorize(mockHandleUrl);
    const expected = {
      "id-methodology": ["system"],
      libertyToPrison: ["countOverTime"],
      system: ["libertyToPrison"],
    };
    expect(store.userAllowedNavigation).toEqual(expected);
  });

  test("returns the navigation object minus pagesWithRestrictions plus pages where route permission is true", async () => {
    mockIsAuthenticated.mockResolvedValue(true);
    const tenantMetadata = {
      [metadataField]: {
        stateCode,
        routes: {
          system_prison: true,
        },
      },
    };
    mockGetUser.mockResolvedValue({ email_verified: true, ...tenantMetadata });
    await store.authorize(mockHandleUrl);
    const expected = {
      "id-methodology": ["system"],
      libertyToPrison: ["countOverTime"],
      prison: ["countOverTime"],
      system: ["libertyToPrison", "prison"],
    };
    expect(store.userAllowedNavigation).toEqual(expected);
  });

  test("returns the navigation object minus restricted page when page permission is false", async () => {
    mockIsAuthenticated.mockResolvedValue(true);
    const tenantMetadata = {
      [metadataField]: {
        stateCode,
        routes: {
          system_prison: false,
        },
      },
    };
    mockGetUser.mockResolvedValue({ email_verified: true, ...tenantMetadata });
    await store.authorize(mockHandleUrl);
    const expected = {
      "id-methodology": ["system"],
      libertyToPrison: ["countOverTime"],
      system: ["libertyToPrison"],
    };
    expect(store.userAllowedNavigation).toEqual(expected);
  });

  test("returns the navigation object when pagesWithRestrictions is empty", async () => {
    tenants[stateCode].pagesWithRestrictions = [];

    mockIsAuthenticated.mockResolvedValue(true);
    const tenantMetadata = {
      [metadataField]: {
        stateCode,
        routes: {
          system_prison: false,
        },
      },
    };
    mockGetUser.mockResolvedValue({ email_verified: true, ...tenantMetadata });
    await store.authorize(mockHandleUrl);
    expect(store.userAllowedNavigation).toEqual(tenants[stateCode].navigation);
  });

  describe("when the browser isIE11", () => {
    let tenantMetadata;
    beforeEach(() => {
      mockIsIE11.mockReturnValue(true);
      mockIsAuthenticated.mockResolvedValue(true);
      tenantMetadata = {
        [metadataField]: {
          stateCode,
          routes: {
            system_prison: false,
          },
        },
      };
      mockGetUser.mockResolvedValue({
        email_verified: true,
        ...tenantMetadata,
      });
      mockGetUser.mockResolvedValue({
        email_verified: true,
        ...tenantMetadata,
      });
    });

    test("returns the navigation object minus the officer chart", async () => {
      tenants[stateCode].navigation = {
        system: [
          PATHWAYS_PAGES.libertyToPrison,
          PATHWAYS_PAGES.prison,
          PATHWAYS_PAGES.supervision,
        ],
        libertyToPrison: [PATHWAYS_SECTIONS.countOverTime],
        prison: [PATHWAYS_SECTIONS.countOverTime],
        supervision: [PATHWAYS_SECTIONS.countOverTime],
        supervisionToPrison: [PATHWAYS_SECTIONS.countByOfficer],
        "id-methodology": [DASHBOARD_VIEWS.system],
      };

      await store.authorize(mockHandleUrl);
      const expected = {
        "id-methodology": ["system"],
        libertyToPrison: ["countOverTime"],
        system: ["libertyToPrison"],
        supervisionToPrison: [],
      };
      expect(store.userAllowedNavigation).toEqual(expected);
    });

    test("it does not error if allowed.supervisionToPrison is undefined", async () => {
      tenants[stateCode].navigation = {
        system: [
          PATHWAYS_PAGES.libertyToPrison,
          PATHWAYS_PAGES.prison,
          PATHWAYS_PAGES.supervision,
        ],
        libertyToPrison: [PATHWAYS_SECTIONS.countOverTime],
        prison: [PATHWAYS_SECTIONS.countOverTime],
        supervision: [PATHWAYS_SECTIONS.countOverTime],
        "id-methodology": [DASHBOARD_VIEWS.system],
      };

      await store.authorize(mockHandleUrl);
      const expected = {
        "id-methodology": ["system"],
        libertyToPrison: ["countOverTime"],
        system: ["libertyToPrison"],
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
});
