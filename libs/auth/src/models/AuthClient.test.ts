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

import createAuth0Client from "@auth0/auth0-spa-js";

import { isTestEnv } from "~client-env-utils";

import { AuthClient } from "./AuthClient";

vi.mock("@auth0/auth0-spa-js");
vi.mock("~client-env-utils");

let client: AuthClient;
const isAuthenticatedMock = vi.fn();
const getUserMock = vi.fn();
const loginWithRedirectMock = vi.fn();
const logoutMock = vi.fn();
const getTokenSilentlyMock = vi.fn();
const handleRedirectCallbackMock = vi.fn();

beforeEach(() => {
  // for convenience, auth is bypassed in test mode. Override the env here to test the real functionality
  vi.mocked(isTestEnv).mockReturnValue(false);

  const mockClient = {
    isAuthenticated: isAuthenticatedMock,
    getUser: getUserMock,
    loginWithRedirect: loginWithRedirectMock,
    logout: logoutMock,
    getTokenSilently: getTokenSilentlyMock,
    handleRedirectCallback: handleRedirectCallbackMock,
  };
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  vi.mocked(createAuth0Client).mockResolvedValue(mockClient as any);

  client = new AuthClient({ client_id: "test", domain: "test" });
});

describe("hydration", () => {
  test("initial state", () => {
    expect(client.hydrationState).toMatchInlineSnapshot(`
      {
        "status": "needs hydration",
      }
    `);
  });

  test("success", async () => {
    isAuthenticatedMock.mockResolvedValue(true);
    getUserMock.mockResolvedValue({});

    const done = client.hydrate();

    expect(client.hydrationState).toMatchInlineSnapshot(`
      {
        "status": "loading",
      }
    `);
    await done;
    expect(client.hydrationState).toMatchInlineSnapshot(`
      {
        "status": "hydrated",
      }
    `);
  });

  test("failure", async () => {
    vi.mocked(createAuth0Client).mockRejectedValue(new Error("test"));

    await client.hydrate();

    expect(client.hydrationState).toMatchInlineSnapshot(`
      {
        "error": [Error: test],
        "status": "failed",
      }
    `);
  });
});

describe("before hydration", () => {
  test("unauthorized", () => {
    expect(client.isAuthorized).toBeFalse();
    expect(client.isEmailVerificationRequired).toBeFalse();
  });
});

describe("after hydration", () => {
  describe("unauthenticated", () => {
    beforeEach(async () => {
      isAuthenticatedMock.mockResolvedValue(false);
      getUserMock.mockResolvedValue(undefined);
      getTokenSilentlyMock.mockRejectedValue(new Error("getToken test"));

      await client.hydrate();
    });

    test("unauthorized", () => {
      expect(client.isAuthorized).toBeFalse();
      expect(client.isEmailVerificationRequired).toBeFalse();
    });

    test("automatic redirect to login", async () => {
      await client.logInIfLoggedOut();
      expect(loginWithRedirectMock).toHaveBeenCalledExactlyOnceWith({
        appState: { targetPath: "/" },
      });

      await client.logInIfLoggedOut("/another/page");
      expect(loginWithRedirectMock).toHaveBeenLastCalledWith({
        appState: { targetPath: "/another/page" },
      });
    });

    test("cannot get access token", async () => {
      await expect(
        async () => await client.getTokenSilently(),
      ).rejects.toThrowErrorMatchingInlineSnapshot(`[Error: getToken test]`);
    });

    test("log in", async () => {
      await client.logIn();
      expect(loginWithRedirectMock).toHaveBeenCalledExactlyOnceWith({
        appState: { targetPath: "/" },
      });

      await client.logIn("/another/page");
      expect(loginWithRedirectMock).toHaveBeenLastCalledWith({
        appState: { targetPath: "/another/page" },
      });
    });
  });

  describe("authenticated", () => {
    beforeEach(async () => {
      isAuthenticatedMock.mockResolvedValue(true);
      getUserMock.mockResolvedValue({ email_verified: true });
      getTokenSilentlyMock.mockResolvedValue("test-token");

      await client.hydrate();
    });

    test("authorized", () => {
      expect(client.isAuthorized).toBeTrue();
    });

    test("no automatic redirect to login", async () => {
      await client.logInIfLoggedOut();
      expect(loginWithRedirectMock).not.toHaveBeenCalled();
    });

    test("can get access token", async () => {
      expect(await client.getTokenSilently()).toMatchInlineSnapshot(
        `"test-token"`,
      );
    });

    test("log out", async () => {
      vi.stubGlobal("location", { origin: "https://example.com" });

      await client.logout();
      expect(logoutMock).toHaveBeenCalledExactlyOnceWith({
        returnTo: "https://example.com/",
      });

      await client.logout("/logged-out");
      expect(logoutMock).toHaveBeenLastCalledWith({
        returnTo: "https://example.com/logged-out",
      });
    });

    describe("redirect from Auth0", () => {
      const navigateMock = vi.fn();

      test("handled", async () => {
        vi.stubGlobal("location", { search: "?code=abc&state=def" });
        handleRedirectCallbackMock.mockResolvedValue({
          appState: { targetPath: "/some/page" },
        });

        await client.handleRedirectFromLogin(navigateMock);
        expect(handleRedirectCallbackMock).toHaveBeenCalledOnce();
        expect(navigateMock).toHaveBeenCalledExactlyOnceWith("/some/page", {
          replace: true,
        });
      });

      test("handled only once", async () => {
        vi.stubGlobal("location", { search: "?code=abc&state=def" });

        handleRedirectCallbackMock.mockResolvedValue({
          appState: { targetPath: "/some/page" },
        });

        const call1 = client.handleRedirectFromLogin(navigateMock);
        const call2 = client.handleRedirectFromLogin(navigateMock);

        await Promise.all([call1, call2]);

        expect(handleRedirectCallbackMock).toHaveBeenCalledOnce();
        expect(navigateMock).toHaveBeenCalledOnce();
      });

      test("not handled if params are missing", async () => {
        await expect(
          async () => await client.handleRedirectFromLogin(navigateMock),
        ).rejects.toThrowErrorMatchingInlineSnapshot(
          `[Error: Cannot handle redirect from Auth0, missing code and state URL params]`,
        );
        expect(handleRedirectCallbackMock).not.toHaveBeenCalled();
      });

      test("redirects to default path", async () => {
        vi.stubGlobal("location", { search: "?code=abc&state=def" });
        // here appState is missing entirely from the response, which triggers the default
        handleRedirectCallbackMock.mockResolvedValue({});

        await client.handleRedirectFromLogin(navigateMock);

        expect(navigateMock).toHaveBeenCalledExactlyOnceWith("/", {
          replace: true,
        });
      });

      test("override default redirect path", async () => {
        vi.stubGlobal("location", { search: "?code=abc&state=def" });
        // here appState does not contain a targetPath, which also triggers the default
        handleRedirectCallbackMock.mockResolvedValue({
          appState: {
            // this is the wrong property ... inspired by a typo made during development
            targetUrl: "/some/page",
          },
        });

        await client.handleRedirectFromLogin(navigateMock, "/another/page");

        expect(navigateMock).toHaveBeenCalledExactlyOnceWith("/another/page", {
          replace: true,
        });
      });
    });
  });

  describe("authenticated with unverified email", () => {
    beforeEach(async () => {
      isAuthenticatedMock.mockResolvedValue(true);
      getUserMock.mockResolvedValue({ email_verified: false });

      await client.hydrate();
    });

    test("unauthorized", () => {
      expect(client.isAuthorized).toBeFalse();
      expect(client.isEmailVerificationRequired).toBeTrue();
    });

    test("no automatic redirect to login", async () => {
      await client.logInIfLoggedOut();
      expect(loginWithRedirectMock).not.toHaveBeenCalled();
    });
  });
});
