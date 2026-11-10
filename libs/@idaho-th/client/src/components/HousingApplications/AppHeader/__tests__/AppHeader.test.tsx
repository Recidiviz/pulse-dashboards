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
import userEvent from "@testing-library/user-event";

import { AppHeader } from "../AppHeader";

const testDoubles = vi.hoisted(() => ({
  isAuthorized: true,
  loginWithRedirect: vi.fn(),
  logout: vi.fn(),
}));

vi.mock("@recidiviz/design-system", () => ({
  Assets: {
    LOGO: "recidiviz-logo.png",
  },
}));

vi.mock("../../../../datastores/IdahoTHStoreContext", () => ({
  useIdahoTHStore: () => ({
    rootStore: {
      userStore: {
        isAuthorized: testDoubles.isAuthorized,
        loginWithRedirect: testDoubles.loginWithRedirect,
        logout: testDoubles.logout,
      },
    },
  }),
}));

describe("AppHeader", () => {
  beforeEach(() => {
    testDoubles.isAuthorized = true;
    testDoubles.loginWithRedirect.mockReset();
    testDoubles.logout.mockReset();
  });

  test("logs the user out when Log out is clicked", async () => {
    const user = userEvent.setup();

    render(<AppHeader />);

    await user.click(screen.getByRole("button", { name: "Log out" }));

    expect(testDoubles.logout).toHaveBeenCalledWith({
      logoutParams: { returnTo: window.location.origin },
    });
    expect(testDoubles.loginWithRedirect).not.toHaveBeenCalled();
  });

  test("logs the user in when Log in is clicked", async () => {
    testDoubles.isAuthorized = false;
    const user = userEvent.setup();

    render(<AppHeader />);

    await user.click(screen.getByRole("button", { name: "Log in" }));

    expect(testDoubles.loginWithRedirect).toHaveBeenCalledTimes(1);
    expect(testDoubles.logout).not.toHaveBeenCalled();
  });
});
