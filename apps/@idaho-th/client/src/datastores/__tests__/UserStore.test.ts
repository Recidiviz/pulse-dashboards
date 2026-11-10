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

import { AUTH0_CONNECTION, SIGN_IN_FLOW } from "~@idaho-th/shared";

import { UserStore } from "../UserStore";

const STAFF_AUTH0_CONNECTION = "Username-Password-Authentication";

const CLIENT_ID = "auth0-client-id";

const AUTH_SETTINGS = {
  authorizationParams: {
    audience: "https://idaho-th-api",
    redirect_uri: "http://localhost:4300",
  },
  clientId: CLIENT_ID,
  domain: "example.auth0.com",
};

const testDoubles = vi.hoisted(() => ({
  createAuth0Client: vi.fn(),
  loginWithRedirect: vi.fn(),
  isAuthenticated: vi.fn(),
  getUser: vi.fn(),
  logout: vi.fn(),
  appEnv: "",
}));

vi.mock("@auth0/auth0-spa-js", () => ({
  createAuth0Client: testDoubles.createAuth0Client,
}));

vi.mock("~@idaho-th/client/runtimeConfig", () => ({
  getIdahoThRuntimeConfig: () => ({
    auth0Domain: "example.auth0.com",
    auth0ClientId: "auth0-client-id",
    auth0Audience: "https://idaho-th-api",
    apiUrl: "/api/trpc",
    appEnv: testDoubles.appEnv,
  }),
}));

describe("UserStore", () => {
  beforeEach(() => {
    testDoubles.createAuth0Client.mockResolvedValue({
      loginWithRedirect: testDoubles.loginWithRedirect,
      isAuthenticated: testDoubles.isAuthenticated,
      getUser: testDoubles.getUser,
      logout: testDoubles.logout,
    });
    testDoubles.loginWithRedirect.mockReset();
    testDoubles.isAuthenticated.mockReset().mockResolvedValue(false);
    testDoubles.getUser.mockReset();
    testDoubles.logout.mockReset();
    testDoubles.appEnv = "";
    document.cookie = `auth0.${CLIENT_ID}.is.authenticated=; max-age=0`;
    sessionStorage.clear();
    window.history.pushState({}, "", "/");
  });

  afterEach(() => {
    window.history.pushState({}, "", "/");
  });

  describe("session recovery on page load", () => {
    test("recovers a lost in-memory session with a full-page redirect", async () => {
      document.cookie = `auth0.${CLIENT_ID}.is.authenticated=true`;
      const userStore = new UserStore(AUTH_SETTINGS);

      await userStore.authorize(vi.fn(), { redirectIfUnauthenticated: false });

      expect(testDoubles.loginWithRedirect).toHaveBeenCalledWith({
        appState: { targetUrl: window.location.href },
        authorizationParams: { prompt: "none" },
      });
    });

    test("sends a visitor who never logged in to /login instead of Auth0", async () => {
      const userStore = new UserStore(AUTH_SETTINGS);

      await userStore.authorize(vi.fn(), { redirectIfUnauthenticated: false });

      expect(testDoubles.loginWithRedirect).not.toHaveBeenCalled();
      expect(userStore.isAuthorized).toBe(false);
      expect(userStore.userIsLoading).toBe(false);
    });

    test("recovers an authenticated user who lands directly on /login", async () => {
      document.cookie = `auth0.${CLIENT_ID}.is.authenticated=true`;
      window.history.pushState({}, "", "/login");
      const userStore = new UserStore(AUTH_SETTINGS);

      await userStore.authorize(vi.fn(), { redirectIfUnauthenticated: false });

      expect(testDoubles.loginWithRedirect).toHaveBeenCalledWith({
        appState: { targetUrl: window.location.href },
        authorizationParams: { prompt: "none" },
      });
      expect(testDoubles.logout).not.toHaveBeenCalled();
    });

    test("only attempts the cookie-driven recovery redirect once per tab", async () => {
      document.cookie = `auth0.${CLIENT_ID}.is.authenticated=true`;
      const userStore = new UserStore(AUTH_SETTINGS);

      await userStore.authorize(vi.fn(), { redirectIfUnauthenticated: false });
      expect(testDoubles.loginWithRedirect).toHaveBeenCalledTimes(1);

      await userStore.authorize(vi.fn(), { redirectIfUnauthenticated: false });
      expect(testDoubles.loginWithRedirect).toHaveBeenCalledTimes(1);
      expect(userStore.isAuthorized).toBe(false);
      expect(userStore.userIsLoading).toBe(false);
      expect(testDoubles.logout).toHaveBeenCalledWith({ openUrl: false });
    });

    test("still records a recovery attempt when the caller forces a redirect, so a later automatic call doesn't also fire", async () => {
      document.cookie = `auth0.${CLIENT_ID}.is.authenticated=true`;
      const userStore = new UserStore(AUTH_SETTINGS);

      await userStore.authorize(vi.fn());
      expect(testDoubles.loginWithRedirect).toHaveBeenCalledTimes(1);

      await userStore.authorize(vi.fn(), { redirectIfUnauthenticated: false });
      expect(testDoubles.loginWithRedirect).toHaveBeenCalledTimes(1);
    });

    test("degrades gracefully instead of throwing when sessionStorage is blocked", async () => {
      const getItemSpy = vi
        .spyOn(Storage.prototype, "getItem")
        .mockImplementation(() => {
          throw new DOMException("blocked", "SecurityError");
        });
      const setItemSpy = vi
        .spyOn(Storage.prototype, "setItem")
        .mockImplementation(() => {
          throw new DOMException("blocked", "SecurityError");
        });
      document.cookie = `auth0.${CLIENT_ID}.is.authenticated=true`;
      const userStore = new UserStore(AUTH_SETTINGS);

      await userStore.authorize(vi.fn(), { redirectIfUnauthenticated: false });

      expect(userStore.authError).toBeUndefined();
      expect(testDoubles.loginWithRedirect).toHaveBeenCalledWith({
        appState: { targetUrl: window.location.href },
        authorizationParams: { prompt: "none" },
      });

      getItemSpy.mockRestore();
      setItemSpy.mockRestore();
    });

    test("clearing the recovery marker on success also degrades gracefully when storage is blocked", async () => {
      const removeItemSpy = vi
        .spyOn(Storage.prototype, "removeItem")
        .mockImplementation(() => {
          throw new DOMException("blocked", "SecurityError");
        });
      testDoubles.isAuthenticated.mockResolvedValue(true);
      testDoubles.createAuth0Client.mockResolvedValue({
        loginWithRedirect: testDoubles.loginWithRedirect,
        isAuthenticated: testDoubles.isAuthenticated,
        logout: testDoubles.logout,
        getUser: vi.fn().mockResolvedValue({ sub: "auth0|123" }),
      });
      const userStore = new UserStore(AUTH_SETTINGS);

      await userStore.authorize(vi.fn(), { redirectIfUnauthenticated: false });

      expect(userStore.authError).toBeUndefined();
      expect(userStore.isAuthorized).toBe(true);

      removeItemSpy.mockRestore();
    });
  });

  describe("access denied", () => {
    test("strips ?error from the URL instead of leaving it to persist across reloads", async () => {
      window.history.pushState(
        {},
        "",
        "/?error=access_denied&error_description=Access%20denied",
      );
      const userStore = new UserStore(AUTH_SETTINGS);

      await userStore.authorize(vi.fn(), { redirectIfUnauthenticated: false });

      expect(window.location.search).toBe("");
      expect(userStore.authError?.message).toBe(
        "Authentication failed. Please try again.",
      );
    });
  });

  describe("bounce-back from a stale-session recovery redirect", () => {
    test("lands on /login instead of surfacing an error when Auth0 reports login_required", async () => {
      window.history.pushState(
        {},
        "",
        "/login?error=login_required&error_description=Login%20required",
      );
      const userStore = new UserStore(AUTH_SETTINGS);

      await userStore.authorize(vi.fn(), { redirectIfUnauthenticated: false });

      expect(window.location.search).toBe("");
      expect(userStore.authError).toBeUndefined();
      expect(userStore.isAuthorized).toBe(false);
      expect(userStore.userIsLoading).toBe(false);
      expect(testDoubles.logout).toHaveBeenCalledWith({ openUrl: false });
    });

    test("also handles interaction_required the same way", async () => {
      window.history.pushState(
        {},
        "",
        "/login?error=interaction_required&error_description=Interaction%20required",
      );
      const userStore = new UserStore(AUTH_SETTINGS);

      await userStore.authorize(vi.fn(), { redirectIfUnauthenticated: false });

      expect(userStore.authError).toBeUndefined();
      expect(userStore.isAuthorized).toBe(false);
    });
  });

  describe("invalid state", () => {
    test("logs out locally and lands on /login instead of looping back into Auth0", async () => {
      window.history.pushState({}, "", "/?code=abc&state=xyz");
      testDoubles.createAuth0Client.mockResolvedValue({
        loginWithRedirect: testDoubles.loginWithRedirect,
        isAuthenticated: testDoubles.isAuthenticated,
        logout: testDoubles.logout,
        handleRedirectCallback: vi
          .fn()
          .mockRejectedValue(new Error("Invalid state")),
      });
      const userStore = new UserStore(AUTH_SETTINGS);

      await userStore.authorize(vi.fn(), { redirectIfUnauthenticated: false });

      expect(testDoubles.logout).toHaveBeenCalledWith({ openUrl: false });
      expect(testDoubles.loginWithRedirect).not.toHaveBeenCalled();
      expect(userStore.isAuthorized).toBe(false);
      expect(userStore.userIsLoading).toBe(false);
      expect(userStore.authError).toBeUndefined();
    });

    test("still stops loading instead of spinning forever when the local logout itself throws", async () => {
      window.history.pushState({}, "", "/?code=abc&state=xyz");
      testDoubles.logout.mockRejectedValue(new Error("storage blocked"));
      testDoubles.createAuth0Client.mockResolvedValue({
        loginWithRedirect: testDoubles.loginWithRedirect,
        isAuthenticated: testDoubles.isAuthenticated,
        logout: testDoubles.logout,
        handleRedirectCallback: vi
          .fn()
          .mockRejectedValue(new Error("Invalid state")),
      });
      const userStore = new UserStore(AUTH_SETTINGS);

      await userStore.authorize(vi.fn(), { redirectIfUnauthenticated: false });

      expect(userStore.isAuthorized).toBe(false);
      expect(userStore.userIsLoading).toBe(false);
      expect(userStore.authError).toBeUndefined();
    });
  });

  test("starts login with the staff Auth0 connection for the staff database flow", async () => {
    const userStore = new UserStore(AUTH_SETTINGS);

    await userStore.loginWithEmail(
      "mock.staff@idoc.idaho.gov",
      SIGN_IN_FLOW.STAFF_DATABASE,
    );

    expect(testDoubles.loginWithRedirect).toHaveBeenCalledWith({
      appState: { targetUrl: `${window.location.origin}/` },
      authorizationParams: {
        connection: STAFF_AUTH0_CONNECTION,
        login_hint: "mock.staff@idoc.idaho.gov",
      },
    });
  });

  test("falls back to the staff database connection for the SSO flow when appEnv is staging", async () => {
    testDoubles.appEnv = "staging";
    const userStore = new UserStore(AUTH_SETTINGS);

    await userStore.loginWithEmail(
      "mock.staff@idoc.idaho.gov",
      SIGN_IN_FLOW.STAFF_SSO,
    );

    expect(testDoubles.loginWithRedirect).toHaveBeenCalledWith(
      expect.objectContaining({
        authorizationParams: expect.objectContaining({
          connection: AUTH0_CONNECTION.STAFF_DATABASE,
        }),
      }),
    );
  });

  test("names the IDOC connection for the staff SSO flow in production", async () => {
    testDoubles.appEnv = "production";
    const userStore = new UserStore(AUTH_SETTINGS);

    await userStore.loginWithEmail(
      "mock.staff@idoc.idaho.gov",
      SIGN_IN_FLOW.STAFF_SSO,
    );

    expect(testDoubles.loginWithRedirect).toHaveBeenCalledWith({
      appState: { targetUrl: `${window.location.origin}/` },
      authorizationParams: {
        connection: AUTH0_CONNECTION.IDOC_SSO,
        login_hint: "mock.staff@idoc.idaho.gov",
      },
    });
  });

  test("falls back to the staff database connection when appEnv is unset", async () => {
    // Local dev sets neither "staging" nor "production", and the IDOC
    // connection is enabled in neither of those tenants.
    const userStore = new UserStore(AUTH_SETTINGS);

    await userStore.loginWithEmail(
      "mock.staff@idoc.idaho.gov",
      SIGN_IN_FLOW.STAFF_SSO,
    );

    expect(testDoubles.loginWithRedirect).toHaveBeenCalledWith(
      expect.objectContaining({
        authorizationParams: expect.objectContaining({
          connection: AUTH0_CONNECTION.STAFF_DATABASE,
        }),
      }),
    );
  });

  test("routes the provider flow to the passwordless connection", async () => {
    const userStore = new UserStore(AUTH_SETTINGS);

    await userStore.loginWithEmail("hope@housing.org", SIGN_IN_FLOW.PROVIDER);

    expect(testDoubles.loginWithRedirect).toHaveBeenCalledWith(
      expect.objectContaining({
        authorizationParams: expect.objectContaining({
          connection: AUTH0_CONNECTION.PASSWORDLESS_EMAIL,
          idaho_th_role: "provider",
        }),
      }),
    );
  });

  test("routes a Recidiviz case manager to the passwordless connection as staff", async () => {
    const userStore = new UserStore(AUTH_SETTINGS);

    await userStore.loginWithEmail(
      "staffer@recidiviz.org",
      SIGN_IN_FLOW.RECIDIVIZ_STAFF_PASSWORDLESS,
    );

    expect(testDoubles.loginWithRedirect).toHaveBeenCalledWith({
      appState: { targetUrl: `${window.location.origin}/` },
      authorizationParams: {
        connection: AUTH0_CONNECTION.PASSWORDLESS_EMAIL,
        login_hint: "staffer@recidiviz.org",
        idaho_th_role: "staff",
      },
    });
  });
});
