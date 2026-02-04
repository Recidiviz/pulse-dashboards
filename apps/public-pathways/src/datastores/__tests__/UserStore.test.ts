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

import { createAuth0Client } from "@auth0/auth0-spa-js";
import { Mock } from "vitest";

import { RootStore } from "../RootStore";
import UserStore from "../UserStore";

vi.mock("@auth0/auth0-spa-js");
vi.mock("@sentry/react");

const METADATA_NAMESPACE = import.meta.env
  .VITE_PUBLIC_PATHWAYS_METADATA_NAMESPACE;

const mockCreateAuth0Client = createAuth0Client as Mock;
const mockGetUser = vi.fn();
const mockHandleRedirectCallback = vi.fn();
const mockIsAuthenticated = vi.fn();
const mockLoginWithRedirect = vi.fn();
const mockGetTokenSilently = vi.fn();
const mockLogout = vi.fn();

const mockHandleUrl = vi.fn();

const mockRootStore = {
  userStore: undefined,
} as unknown as RootStore;

const tenantId = "US_MO";
const metadataField = `${METADATA_NAMESPACE}app_metadata`;
const metadata = { [metadataField]: { stateCode: tenantId } };
const testAuthSettings = {
  domain: "example.com",
  clientId: "abc123",
  redirect_url: window.location.href,
};

beforeEach(() => {
  window.history.replaceState({}, "Test", window.location.origin);
  mockGetUser.mockResolvedValue(metadata);
  mockCreateAuth0Client.mockResolvedValue({
    getUser: mockGetUser,
    handleRedirectCallback: mockHandleRedirectCallback,
    isAuthenticated: mockIsAuthenticated,
    loginWithRedirect: mockLoginWithRedirect,
    getTokenSilently: mockGetTokenSilently,
    logout: mockLogout,
  });
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
  expect(error?.message).toMatch("No Auth0 configuration provided");
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
  mockHandleRedirectCallback.mockRejectedValue(new Error("Invalid state"));
  const urlWithToken = new URL(window.location.href);
  urlWithToken.search = "?code=123456&state=abcdef";
  window.history.pushState({}, "Test", urlWithToken.href);
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
  const mockUrl = `${window.location.origin}/some/url`;
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
  const targetUrl = "http://localhost:3050/somePage?id=1";
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
  const targetUrl = `${window.location.origin}/somePage?id=1`;
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
