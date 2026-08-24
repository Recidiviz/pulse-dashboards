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

import { render } from "@testing-library/react-native";
import React from "react";
import { useAuth0 } from "react-native-auth0";

import { stateCodeParam } from "~@meetings/app/entities/state-code";
import { peekPendingLoginDeepLink } from "~@meetings/app/features/login-deep-link";

import AppNavigator from "./AppNavigator";

jest.mock("@react-native-async-storage/async-storage", () =>
  require("@react-native-async-storage/async-storage/jest/async-storage-mock"),
);

jest.mock("react-native-auth0", () => ({
  useAuth0: jest.fn(),
}));

// ESM-only packages irrelevant to these tests
jest.mock("superjson", () => ({ __esModule: true, default: {} }));
jest.mock("@trpc/client", () => ({ httpBatchLink: jest.fn(() => ({})) }));

jest.mock("expo-font", () => ({
  useFonts: () => [true, null],
}));

jest.mock("@react-navigation/drawer", () => ({
  createDrawerNavigator: () => ({
    Navigator: ({ children }: { children: React.ReactNode }) => children,
    Screen: ({ children }: { children: unknown }) =>
      typeof children === "function" ? children({}) : null,
  }),
}));

jest.mock("@react-navigation/native", () => ({
  NavigationContainer: ({ children }: { children: React.ReactNode }) =>
    children,
  useNavigationContainerRef: () => ({
    isReady: () => false,
    getCurrentRoute: () => undefined,
    resetRoot: jest.fn(),
  }),
  getStateFromPath: jest.fn(),
  getPathFromState: jest.fn(() => "/"),
}));

jest.mock("~@meetings/app/shared/api", () => ({
  publicTrpc: {
    createClient: jest.fn(() => ({})),
    Provider: ({ children }: { children: React.ReactNode }) => children,
  },
}));

jest.mock("~@meetings/app/shared/analytics", () => ({
  AnalyticsProvider: ({ children }: { children: React.ReactNode }) => children,
  useAnalytics: () => ({ screen: jest.fn() }),
}));

jest.mock("~@meetings/app/features/app-update", () => ({
  AppUpdateModal: () => null,
}));

jest.mock("~@meetings/app/pages/login", () => ({
  LoginScreen: () => null,
}));

jest.mock("~@meetings/app/entities/user", () => ({
  UserContextProvider: ({ children }: { children: React.ReactNode }) =>
    children,
}));

// Records stateCodeParam at mount so tests can pin that the seeding in
// AppNavigator happens during render, before any descendant mounts
const mockAuthenticatedAppRender = jest.fn();
jest.mock("../AuthenticatedApp", () => ({
  __esModule: true,
  default: () => {
    const {
      stateCodeParam: param,
    } = require("~@meetings/app/entities/state-code");
    mockAuthenticatedAppRender(param.current);
    return null;
  },
}));

const mockUseAuth0 = useAuth0 as jest.Mock;

const globals = globalThis as { window?: unknown };
const originalWindow = globals.window;

function makeFakeSessionStorage(): Storage {
  const store = new Map<string, string>();
  return {
    getItem: (key: string) => store.get(key) ?? null,
    setItem: (key: string, value: string) => {
      store.set(key, value);
    },
    removeItem: (key: string) => {
      store.delete(key);
    },
  } as Storage;
}

function setWindow({
  pathname,
  search = "",
  sessionStorage = makeFakeSessionStorage(),
}: {
  pathname: string;
  search?: string;
  sessionStorage?: Storage;
}) {
  globals.window = { sessionStorage, location: { pathname, search } };
  return sessionStorage;
}

const loggedOut = { user: null, isLoading: false };
const loggedIn = { user: { email: "test@example.com" }, isLoading: false };

beforeEach(() => {
  jest.clearAllMocks();
  stateCodeParam.current = "";
});

afterEach(() => {
  globals.window = originalWindow;
});

describe("AppNavigator login deep links", () => {
  it("captures the requested URL during a logged-out render", () => {
    setWindow({ pathname: "/clients/123", search: "?stateCode=US_ID" });
    mockUseAuth0.mockReturnValue(loggedOut);

    render(<AppNavigator />);

    expect(peekPendingLoginDeepLink()).toBe("/clients/123?stateCode=US_ID");
  });

  it("seeds stateCodeParam during render, before AuthenticatedApp mounts", () => {
    setWindow({ pathname: "/" });
    (globals.window as { sessionStorage: Storage }).sessionStorage.setItem(
      "pendingLoginDeepLink",
      "/clients/123/meetings/456?stateCode=US_ID",
    );
    mockUseAuth0.mockReturnValue(loggedIn);

    render(<AppNavigator />);

    expect(mockAuthenticatedAppRender).toHaveBeenCalledWith("US_ID");
  });

  it("does not recapture a URL on logged-out renders after session expiry", () => {
    const sessionStorage = setWindow({ pathname: "/" });
    mockUseAuth0.mockReturnValue(loggedIn);
    const { rerender } = render(<AppNavigator />);

    setWindow({ pathname: "/clients/123", sessionStorage });
    mockUseAuth0.mockReturnValue(loggedOut);
    rerender(<AppNavigator />);

    expect(peekPendingLoginDeepLink()).toBeNull();
  });
});
