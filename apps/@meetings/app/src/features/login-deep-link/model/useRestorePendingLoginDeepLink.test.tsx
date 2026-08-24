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

import {
  LinkingOptions,
  NavigationContainerRefWithCurrent,
} from "@react-navigation/native";
import { act, renderHook } from "@testing-library/react-native";

import { AppStackParamList } from "~@meetings/app/shared/config";

import { useRestorePendingLoginDeepLink } from "./useRestorePendingLoginDeepLink";

const globals = globalThis as { window?: unknown };
const originalWindow = globals.window;

const PENDING_KEY = "pendingLoginDeepLink";

function setWindowWithPending(pending: string | null) {
  const store = new Map<string, string>();
  if (pending !== null) store.set(PENDING_KEY, pending);
  globals.window = {
    sessionStorage: {
      getItem: (key: string) => store.get(key) ?? null,
      setItem: (key: string, value: string) => {
        store.set(key, value);
      },
      removeItem: (key: string) => {
        store.delete(key);
      },
    },
    location: { pathname: "/", search: "" },
  };
  return store;
}

function makeNavigationRef({ isReady = true } = {}) {
  return {
    isReady: jest.fn(() => isReady),
    resetRoot: jest.fn(),
  } as unknown as NavigationContainerRefWithCurrent<AppStackParamList> & {
    isReady: jest.Mock;
    resetRoot: jest.Mock;
  };
}

const parsedState = { routes: [{ name: "Main" }] };

function makeLinking(getStateFromPath: jest.Mock = jest.fn(() => parsedState)) {
  return {
    prefixes: [],
    config: { screens: {} },
    getStateFromPath,
  } as unknown as LinkingOptions<AppStackParamList> & {
    getStateFromPath: jest.Mock;
  };
}

afterEach(() => {
  globals.window = originalWindow;
});

describe("useRestorePendingLoginDeepLink", () => {
  it("restores the pending deep link once logged in and ready", () => {
    const store = setWindowWithPending("/clients/1/meetings/2?stateCode=US_ID");
    const navigationRef = makeNavigationRef();
    const linking = makeLinking();

    renderHook(() =>
      useRestorePendingLoginDeepLink({
        loggedIn: true,
        navigationRef,
        linking,
      }),
    );

    expect(linking.getStateFromPath).toHaveBeenCalledWith(
      "/clients/1/meetings/2?stateCode=US_ID",
      linking.config,
    );
    expect(navigationRef.resetRoot).toHaveBeenCalledWith(parsedState);
    expect(store.has(PENDING_KEY)).toBe(false);
  });

  it("does nothing while logged out", () => {
    const store = setWindowWithPending("/clients/1");
    const navigationRef = makeNavigationRef();
    const linking = makeLinking();

    renderHook(() =>
      useRestorePendingLoginDeepLink({
        loggedIn: false,
        navigationRef,
        linking,
      }),
    );

    expect(navigationRef.resetRoot).not.toHaveBeenCalled();
    // The pending link is preserved for a later login
    expect(store.has(PENDING_KEY)).toBe(true);
  });

  it("does nothing when there is no pending link", () => {
    setWindowWithPending(null);
    const navigationRef = makeNavigationRef();
    const linking = makeLinking();

    renderHook(() =>
      useRestorePendingLoginDeepLink({
        loggedIn: true,
        navigationRef,
        linking,
      }),
    );

    expect(navigationRef.resetRoot).not.toHaveBeenCalled();
  });

  it("defers to the returned callback when the container is not ready", () => {
    const store = setWindowWithPending("/clients/1");
    const navigationRef = makeNavigationRef({ isReady: false });
    const linking = makeLinking();

    const { result } = renderHook(() =>
      useRestorePendingLoginDeepLink({
        loggedIn: true,
        navigationRef,
        linking,
      }),
    );

    // Effect ran while not ready: nothing consumed or navigated
    expect(navigationRef.resetRoot).not.toHaveBeenCalled();
    expect(store.has(PENDING_KEY)).toBe(true);

    // Simulate the container's onReady firing later
    navigationRef.isReady.mockReturnValue(true);
    act(() => result.current());
    expect(navigationRef.resetRoot).toHaveBeenCalledWith(parsedState);
    expect(store.has(PENDING_KEY)).toBe(false);
  });

  it("navigates at most once when both the effect and onReady fire", () => {
    setWindowWithPending("/clients/1");
    const navigationRef = makeNavigationRef();
    const linking = makeLinking();

    const { result } = renderHook(() =>
      useRestorePendingLoginDeepLink({
        loggedIn: true,
        navigationRef,
        linking,
      }),
    );

    act(() => result.current());
    expect(navigationRef.resetRoot).toHaveBeenCalledTimes(1);
  });

  it("consumes the entry but does not navigate on an unparseable path", () => {
    const store = setWindowWithPending("/not/a/route");
    const navigationRef = makeNavigationRef();
    const linking = makeLinking(jest.fn(() => undefined));

    renderHook(() =>
      useRestorePendingLoginDeepLink({
        loggedIn: true,
        navigationRef,
        linking,
      }),
    );

    expect(navigationRef.resetRoot).not.toHaveBeenCalled();
    expect(store.has(PENDING_KEY)).toBe(false);
  });

  it("restores when loggedIn flips from false to true (skip-auth flow)", () => {
    const store = setWindowWithPending("/clients/1");
    const navigationRef = makeNavigationRef();
    const linking = makeLinking();

    const { rerender } = renderHook(
      ({ loggedIn }: { loggedIn: boolean }) =>
        useRestorePendingLoginDeepLink({ loggedIn, navigationRef, linking }),
      { initialProps: { loggedIn: false } },
    );
    expect(navigationRef.resetRoot).not.toHaveBeenCalled();

    rerender({ loggedIn: true });
    expect(navigationRef.resetRoot).toHaveBeenCalledWith(parsedState);
    expect(store.has(PENDING_KEY)).toBe(false);
  });
});
