// Recidiviz - a data platform for criminal justice reform
// Copyright (C) 2025 Recidiviz, Inc.
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

import { configure } from "mobx";

import { AuthorizedUserProfile } from "~auth0-jii";

import { Auth0AuthHandler } from "./Auth0AuthHandler";

vi.hoisted(() => {
  vi.stubEnv("VITE_API_URL_BASE", "http://localhost:9999");
});

let handler: Auth0AuthHandler;

beforeEach(() => {
  configure({ safeDescriptors: false });

  handler = new Auth0AuthHandler();
});

afterEach(() => {
  configure({ safeDescriptors: true });
});

describe("hydration", () => {
  test("delegated to auth client", () => {
    // starts out hydrated because that is default AuthClient behavior in a test env
    expect(handler.hydrationState).toEqual({ status: "hydrated" });

    vi.spyOn(handler.authClient, "hydrationState", "get").mockReturnValue({
      status: "needs hydration",
    });
    expect(handler.hydrationState).toEqual({ status: "needs hydration" });

    vi.spyOn(handler.authClient, "hydrationState", "get").mockReturnValue({
      status: "loading",
    });
    expect(handler.hydrationState).toEqual({ status: "loading" });

    const testError = new Error("oops");
    vi.spyOn(handler.authClient, "hydrationState", "get").mockReturnValue({
      status: "failed",
      error: testError,
    });
    expect(handler.hydrationState).toEqual({
      status: "failed",
      error: testError,
    });
  });

  test("success", async () => {
    vi.spyOn(handler.authClient, "hydrationState", "get").mockReturnValue({
      status: "needs hydration",
    });

    const clientHydrateSpy = vi.spyOn(handler.authClient, "hydrate");

    const hydrationPromise = handler.hydrate();

    expect(handler.hydrationState).toEqual({ status: "loading" });

    await hydrationPromise;

    expect(clientHydrateSpy).toHaveBeenCalled();
  });

  test("error", async () => {
    vi.spyOn(handler.authClient, "hydrationState", "get").mockReturnValue({
      status: "needs hydration",
    });

    const testError = new Error("oops");
    vi.spyOn(handler.authClient, "hydrate").mockImplementation(async () => {
      throw testError;
    });

    const hydrationPromise = handler.hydrate();

    expect(handler.hydrationState).toEqual({ status: "loading" });

    await hydrationPromise;

    expect(handler.hydrationState).toEqual({
      status: "failed",
      error: testError,
    });
  });
});

test("user profile", () => {
  expect(handler.userProfile).toBeUndefined();

  const mockProfile: AuthorizedUserProfile = {
    stateCode: "US_XX",
    pseudonymizedId: "abc344",
    externalId: "123adbc",
  };
  vi.spyOn(handler.authClient, "appMetadata", "get").mockReturnValue(
    mockProfile,
  );

  expect(handler.userProfile).toEqual(mockProfile);
});

test("get firebase token", async () => {
  const mockAuth0Token = "test-auth0-access-token";
  const mockFirebaseToken = "test-firebase-token";
  const clientTokenSpy = vi
    .spyOn(handler.authClient, "getTokenSilently")
    .mockResolvedValue(mockAuth0Token);
  fetchMock.mockResponse(JSON.stringify({ firebaseToken: mockFirebaseToken }));

  await handler.getFirebaseToken();

  expect(clientTokenSpy).toHaveBeenCalled();

  expect(fetchMock.mock.lastCall).toMatchInlineSnapshot(`
    [
      "http://localhost:9999/auth/auth0",
      {
        "headers": {
          "Authorization": "Bearer test-auth0-access-token",
        },
      },
    ]
  `);
});
