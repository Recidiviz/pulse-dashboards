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

import { MockInstance } from "vitest";

import { isDemoMode } from "~client-env-utils";
import { HydrationState } from "~hydration-utils";

import { isEdovoEnv } from "../../utils/edovo";
import { Auth0AuthHandler } from "./Auth0AuthHandler";
import { AuthManager } from "./AuthManager";
import { EdovoAuthHandler } from "./EdovoAuthHandler";
import { AuthorizedUserProperties } from "./types";

vi.mock("~client-env-utils");
vi.mock("./Auth0AuthHandler");
vi.mock("./EdovoAuthHandler");
vi.mock("../../utils/edovo");

let manager: AuthManager;

describe("using auth0", () => {
  let handler: Auth0AuthHandler;

  beforeEach(() => {
    vi.mocked(isEdovoEnv).mockReturnValue(false);

    manager = new AuthManager();
    handler = vi.mocked(Auth0AuthHandler).mock.instances[0];
  });

  test("uses the right handler", () => {
    expect(Auth0AuthHandler).toHaveBeenCalled();
    expect(EdovoAuthHandler).not.toHaveBeenCalled();
  });

  test("properties deferred to handler", () => {
    vi.spyOn(handler, "hydrationState", "get").mockReturnValue({
      status: "loading",
    });
    expect(manager.hydrationState).toEqual({ status: "loading" });

    manager.hydrate();
    expect(handler.hydrate).toHaveBeenCalled();

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const mockClient = { isEmailVerificationRequired: false } as any;
    handler.authClient = mockClient;
    expect(manager.authClient).toBe(mockClient);
    expect(manager.isEmailVerificationRequired).toBeFalse();
    mockClient.isEmailVerificationRequired = true;
    expect(manager.isEmailVerificationRequired).toBeTrue();

    manager.getFirebaseToken();
    expect(handler.getFirebaseToken).toHaveBeenCalled();
  });

  describe("auth state", () => {
    let hydrationSpy: MockInstance<() => HydrationState>;

    const mockUserProfile: AuthorizedUserProperties["userProfile"] = {
      stateCode: "US_XX",
    };

    beforeEach(() => {
      hydrationSpy = vi
        .spyOn(handler, "hydrationState", "get")
        .mockReturnValue({ status: "needs hydration" });
    });

    test("initial state", () => {
      expect(manager.authState).toEqual({ status: "unauthorized" });
    });

    test("blocked on hydration state", () => {
      vi.spyOn(handler, "userProfile", "get").mockReturnValue(mockUserProfile);
      expect(manager.authState).toEqual({ status: "unauthorized" });
    });

    test("authorization with data and hydration state", () => {
      vi.spyOn(handler, "userProfile", "get").mockReturnValue(mockUserProfile);
      hydrationSpy.mockReturnValue({ status: "hydrated" });
      expect(manager.authState).toEqual({
        status: "authorized",
        userProfile: mockUserProfile,
      });
    });
  });

  describe("demo user", () => {
    test("always when in demo env", () => {
      vi.mocked(isDemoMode).mockReturnValue(true);
      expect(manager.isDemoUser).toBeTrue();
    });

    test("false before hydration", () => {
      vi.spyOn(handler, "hydrationState", "get").mockReturnValue({
        status: "needs hydration",
      });
      expect(manager.isDemoUser).toBeFalse();
    });

    test("depends on live_data permission", () => {
      vi.spyOn(handler, "hydrationState", "get").mockReturnValue({
        status: "hydrated",
      });

      vi.spyOn(handler, "userProfile", "get").mockReturnValue({
        stateCode: "US_XX",
      });
      expect(manager.isDemoUser).toBeFalse();

      vi.spyOn(handler, "userProfile", "get").mockReturnValue({
        stateCode: "US_XX",
        permissions: [],
      });

      expect(manager.isDemoUser).toBeTrue();

      vi.spyOn(handler, "userProfile", "get").mockReturnValue({
        stateCode: "US_XX",
        permissions: ["live_data"],
      });
      expect(manager.isDemoUser).toBeFalse();
    });
  });
});

describe("using edovo token", () => {
  test("triggered by environment check", () => {
    vi.mocked(isEdovoEnv).mockReturnValue(true);

    manager = new AuthManager();
    expect(EdovoAuthHandler).toHaveBeenCalled();
    expect(Auth0AuthHandler).not.toHaveBeenCalled();
  });
});
