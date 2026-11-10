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

import { render, screen } from "@testing-library/react";
import type { ReactNode } from "react";

import {
  APP_METADATA_KEY,
  USER_ROLE,
  type UserRole,
} from "~@idaho-th/shared/constants/auth";

import App from "../App";

type SessionData = {
  providerPseudonymizedId?: string | null;
  role?: UserRole | null;
};

type SessionResult = {
  data: SessionData | null;
  isLoading: boolean;
};

type TestUser = {
  [APP_METADATA_KEY]?: {
    pseudonymizedId?: string | null;
    role?: UserRole | null;
  };
  providerPseudonymizedId?: string;
  role?: UserRole;
};

const testDoubles = vi.hoisted(() => ({
  sessionResult: {
    data: {
      providerPseudonymizedId: undefined,
      role: "provider",
    },
    isLoading: false,
  } as SessionResult,
  userStore: {
    isAuthorized: true,
    user: {} as TestUser | undefined,
    userIsLoading: false,
  },
}));

const GENERIC_ERROR_MESSAGE =
  "Something went wrong. Please refresh the page and try again.";

function setUser({
  providerPseudonymizedId,
  role,
}: {
  providerPseudonymizedId?: string | null;
  role?: UserRole | null;
}) {
  testDoubles.userStore.user = {
    [APP_METADATA_KEY]: {
      pseudonymizedId: providerPseudonymizedId,
      role,
    },
  };
}

function setSession(data: SessionData | null, isLoading = false) {
  testDoubles.sessionResult = {
    data,
    isLoading,
  };
}

function expectGenericError() {
  expect(screen.getByText(GENERIC_ERROR_MESSAGE)).toBeTruthy();
}

function withSuppressedConsoleError(callback: () => void) {
  const consoleError = vi
    .spyOn(console, "error")
    .mockImplementation(() => undefined);

  try {
    callback();
  } finally {
    consoleError.mockRestore();
  }
}

vi.mock("~@idaho-th/client", () => ({
  HousingApplications: () => <div>Staff applications</div>,
  LoginPage: () => <div>Login page</div>,
  ProviderApplications: () => <div>Provider applications</div>,
  // The gate has its own suite; here it only has to prove it wraps the whole
  // provider branch rather than one route.
  HousingProviderGate: ({ children }: { children: ReactNode }) => (
    <div data-testid="housing-provider-gate">{children}</div>
  ),
  Spinner: () => <div>Loading</div>,
  useIntercomMessenger: () => undefined,
}));

vi.mock("~@idaho-th/client/trpc", () => ({
  trpc: {
    auth: {
      getSession: {
        useQuery: () => testDoubles.sessionResult,
      },
    },
  },
}));

vi.mock("../datastores/StoreProvider", () => ({
  StoreProvider: ({ children }: { children: ReactNode }) => <>{children}</>,
  useRootStore: () => ({
    userStore: testDoubles.userStore,
  }),
  useUserStore: () => testDoubles.userStore,
}));

vi.mock("../hooks/useAuth", () => ({
  default: () => undefined,
}));

describe("App", () => {
  beforeEach(() => {
    window.history.pushState({}, "", "/");
    setSession({
      providerPseudonymizedId: undefined,
      role: USER_ROLE.PROVIDER,
    });
    testDoubles.userStore = {
      isAuthorized: true,
      user: {},
      userIsLoading: false,
    };
    setUser({
      providerPseudonymizedId: undefined,
      role: USER_ROLE.PROVIDER,
    });
  });

  test("renders staff routes for staff users", () => {
    setUser({
      role: USER_ROLE.STAFF,
    });

    render(<App />);

    expect(screen.getByText("Staff applications")).toBeTruthy();
    expect(screen.queryByText("Provider applications")).toBeNull();
    // Staff never pass through the organization gate at all.
    expect(screen.queryByTestId("housing-provider-gate")).toBeNull();
    expect(testDoubles.userStore.user).toMatchObject({
      role: USER_ROLE.STAFF,
      providerPseudonymizedId: undefined,
    });
  });

  test("renders provider routes for provider users with a provider ID", () => {
    setUser({
      providerPseudonymizedId: "provider-123",
      role: USER_ROLE.PROVIDER,
    });

    render(<App />);

    // Gated by construction: the gate sits around the provider branch, so a
    // second provider route cannot be added outside it by accident.
    const gate = screen.getByTestId("housing-provider-gate");
    expect(gate.contains(screen.getByText("Provider applications"))).toBe(true);
    expect(screen.queryByText("Staff applications")).toBeNull();
    expect(testDoubles.userStore.user).toMatchObject({
      role: USER_ROLE.PROVIDER,
      providerPseudonymizedId: "provider-123",
    });
  });

  test("shows a loading state while the session is loading", () => {
    testDoubles.userStore.userIsLoading = true;

    render(<App />);

    expect(screen.getByText("Loading")).toBeTruthy();
    expect(screen.queryByText("Staff applications")).toBeNull();
    expect(screen.queryByText("Provider applications")).toBeNull();
  });

  test("blocks provider users without a provider ID", () => {
    withSuppressedConsoleError(() => {
      render(<App />);

      expectGenericError();
      expect(screen.queryByText("Provider applications")).toBeNull();
    });
  });

  test("blocks sessions with no role", () => {
    setUser({
      providerPseudonymizedId: "provider-123",
      role: null,
    });

    withSuppressedConsoleError(() => {
      render(<App />);

      expectGenericError();
      expect(screen.queryByText("Staff applications")).toBeNull();
      expect(screen.queryByText("Provider applications")).toBeNull();
    });
  });

  test("blocks users without a session", () => {
    testDoubles.userStore.user = undefined;

    withSuppressedConsoleError(() => {
      render(<App />);

      expectGenericError();
      expect(screen.queryByText("Staff applications")).toBeNull();
      expect(screen.queryByText("Provider applications")).toBeNull();
    });
  });

  test("renders the login page at the /login route", () => {
    window.history.pushState({}, "", "/login");

    render(<App />);

    expect(screen.getByText("Login page")).toBeTruthy();
    expect(screen.queryByText("Staff applications")).toBeNull();
    expect(screen.queryByText("Provider applications")).toBeNull();
  });
});
