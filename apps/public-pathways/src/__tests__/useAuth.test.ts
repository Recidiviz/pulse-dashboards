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

import { renderHook } from "@testing-library/react";
import { when } from "mobx";
import { useIdleTimer } from "react-idle-timer";
import { useNavigate } from "react-router-dom";
import { Mock } from "vitest";

import { useRootStore } from "../components/StoreProvider";
import useAuth from "../useAuth";

// AUTH_ENABLED is derived from the build mode in RootStore; here we toggle it
// directly so we can exercise both the production (auth off) and
// staging/development (auth on) branches of useAuth.
const mockAuthEnabled = vi.hoisted(() => ({ value: true }));

vi.mock("../datastores/RootStore", () => ({
  get AUTH_ENABLED() {
    return mockAuthEnabled.value;
  },
  RootStore: class RootStore {},
}));

vi.mock("../components/StoreProvider");

vi.mock("react-idle-timer", () => ({ useIdleTimer: vi.fn() }));

vi.mock("react-router-dom", async () => {
  const actual = await vi.importActual("react-router-dom");
  return { ...actual, useNavigate: vi.fn() };
});

vi.mock("mobx", async () => {
  const actual = await vi.importActual("mobx");
  return { ...actual, when: vi.fn() };
});

const mockUseRootStore = useRootStore as Mock;
const mockUseNavigate = useNavigate as Mock;
const mockUseIdleTimer = useIdleTimer as Mock;
const mockWhen = when as Mock;

describe("useAuth", () => {
  let mockNavigate: Mock;
  let mockUserStore: {
    isAuthorized: boolean;
    authError?: Error;
    authorize: Mock;
    logout: Mock;
  };

  beforeEach(() => {
    vi.clearAllMocks();

    mockAuthEnabled.value = true;
    mockNavigate = vi.fn();
    mockUserStore = {
      isAuthorized: false,
      authError: undefined,
      authorize: vi.fn(),
      logout: vi.fn(),
    };

    mockUseNavigate.mockReturnValue(mockNavigate);
    mockUseRootStore.mockReturnValue({ userStore: mockUserStore });
    mockWhen.mockReturnValue(vi.fn());
  });

  describe("when auth is enabled (staging/development)", () => {
    beforeEach(() => {
      mockAuthEnabled.value = true;
    });

    it("registers a mobx `when` reaction to authorize the user", () => {
      renderHook(() => useAuth());

      expect(mockWhen).toHaveBeenCalledOnce();
      expect(mockWhen).toHaveBeenCalledWith(
        expect.any(Function),
        expect.any(Function),
      );
    });

    it("the reaction predicate tracks whether the user is unauthorized", () => {
      renderHook(() => useAuth());
      const predicate = mockWhen.mock.calls[0][0];

      mockUserStore.isAuthorized = false;
      expect(predicate()).toBe(true);

      mockUserStore.isAuthorized = true;
      expect(predicate()).toBe(false);
    });

    it("the reaction effect authorizes and syncs the router to the target URL", () => {
      renderHook(() => useAuth());
      const effect = mockWhen.mock.calls[0][1];

      effect();

      expect(mockUserStore.authorize).toHaveBeenCalledWith(
        expect.any(Function),
      );
      const handleTargetUrl = mockUserStore.authorize.mock.calls[0][0];
      handleTargetUrl(`${window.location.origin}/prison?foo=bar#section`);
      expect(mockNavigate).toHaveBeenCalledWith("/prison?foo=bar#section", {
        replace: true,
      });
    });

    it("disposes the reaction on unmount", () => {
      const dispose = vi.fn();
      mockWhen.mockReturnValue(dispose);

      const { unmount } = renderHook(() => useAuth());
      unmount();

      expect(dispose).toHaveBeenCalledOnce();
    });
  });

  describe("when auth is disabled (production)", () => {
    beforeEach(() => {
      mockAuthEnabled.value = false;
    });

    it("does not register the authorize reaction", () => {
      renderHook(() => useAuth());

      expect(mockWhen).not.toHaveBeenCalled();
    });

    it("never calls authorize, so the user is not redirected to login", () => {
      renderHook(() => useAuth());

      expect(mockUserStore.authorize).not.toHaveBeenCalled();
    });
  });

  describe("regardless of auth mode", () => {
    it.each([
      ["enabled", true],
      ["disabled", false],
    ])("registers the idle timer when auth is %s", (_label, enabled) => {
      mockAuthEnabled.value = enabled as boolean;

      renderHook(() => useAuth());

      expect(mockUseIdleTimer).toHaveBeenCalledOnce();
    });

    it("throws when the user store has an auth error", () => {
      mockUserStore.authError = new Error("boom");

      expect(() => renderHook(() => useAuth())).toThrow("boom");
    });
  });
});
