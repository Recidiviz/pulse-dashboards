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

import { render, waitFor } from "@testing-library/react";

import useAuth from "../useAuth";

const testDoubles = vi.hoisted(() => ({
  navigate: vi.fn(),
  userStore: {
    authError: undefined as Error | undefined,
    authorize: vi.fn(),
    isAuthorized: false,
    userIsLoading: false,
  },
}));

vi.mock("react-router-dom", () => ({
  useNavigate: () => testDoubles.navigate,
}));

vi.mock("../../datastores/StoreProvider", () => ({
  useUserStore: () => testDoubles.userStore,
}));

function TestComponent() {
  useAuth();
  return null;
}

describe("useAuth", () => {
  beforeEach(() => {
    testDoubles.navigate.mockReset();
    testDoubles.userStore.authError = undefined;
    testDoubles.userStore.isAuthorized = false;
    testDoubles.userStore.userIsLoading = false;
    testDoubles.userStore.authorize.mockReset();
    testDoubles.userStore.authorize.mockResolvedValue(undefined);
  });

  test("sends the user to login when they are not signed in", async () => {
    render(<TestComponent />);

    await waitFor(() => {
      expect(testDoubles.userStore.authorize).toHaveBeenCalledWith(
        expect.any(Function),
        { redirectIfUnauthenticated: false },
      );
    });
    await waitFor(() => {
      expect(testDoubles.navigate).toHaveBeenCalledWith("/login", {
        replace: true,
      });
    });
  });

  test("does not navigate to login when the user is already authorized", async () => {
    testDoubles.userStore.isAuthorized = true;

    render(<TestComponent />);

    await waitFor(() => {
      expect(testDoubles.userStore.authorize).toHaveBeenCalled();
    });

    expect(testDoubles.navigate).not.toHaveBeenCalledWith(
      "/login",
      expect.anything(),
    );
  });

  test("does not navigate to login while the session is still loading", async () => {
    testDoubles.userStore.userIsLoading = true;

    render(<TestComponent />);

    await waitFor(() => {
      expect(testDoubles.userStore.authorize).toHaveBeenCalled();
    });

    expect(testDoubles.navigate).not.toHaveBeenCalledWith(
      "/login",
      expect.anything(),
    );
  });
});
