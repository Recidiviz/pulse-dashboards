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
  fireEvent,
  render,
  screen,
  waitFor,
} from "@testing-library/react-native";
import React from "react";
import { useAuth0 } from "react-native-auth0";

import { LoginScreen } from "./index";

// Mock useSetDocumentTitle hooks, since it modifies document.title, and it causes errors
jest.mock("~@meetings/app/shared/lib/platform/useSetDocumentTitle", () => ({
  useSetDocumentTitle: () => null,
}));

// Mock out the "Learn more" sheet/modal - it pulls in @gorhom/bottom-sheet,
// which is unrelated to what this file's tests cover.
jest.mock("./ui/LearnMore", () => ({
  LearnMoreModal: () => null,
  LearnMoreSheet: () => null,
}));

jest.mock("react-native-auth0", () => ({
  useAuth0: jest.fn(),
}));
const mockUseAuth0 = useAuth0 as jest.Mock;

const ACCESS_DENIED_ERROR = Object.assign(
  new Error("No access granted to state data."),
  { name: "access_denied", code: "access_denied" },
);

const OTHER_ERROR = Object.assign(new Error("Login required"), {
  name: "login_required",
  code: "login_required",
});

describe("LoginScreen", () => {
  const mockAuthorize = jest.fn();
  const mockClearCredentials = jest.fn();

  beforeEach(() => {
    jest.clearAllMocks();
    mockUseAuth0.mockReturnValue({
      authorize: mockAuthorize,
      error: null,
      clearCredentials: mockClearCredentials,
    });
  });

  it("renders the sign-in screen by default", () => {
    render(<LoginScreen />);

    expect(screen.getByText("Sign In to Recidiviz")).toBeTruthy();
    expect(screen.getByText("Continue")).toBeTruthy();
  });

  describe("native path: authorize() resolves/rejects in the same JS context", () => {
    it("shows the access-denied screen when authorize() rejects with access_denied", async () => {
      mockAuthorize.mockRejectedValue(ACCESS_DENIED_ERROR);
      render(<LoginScreen />);

      fireEvent.press(screen.getByText("Continue"));

      await waitFor(() =>
        expect(screen.getByText(ACCESS_DENIED_ERROR.message)).toBeTruthy(),
      );
      expect(screen.getByText("Back to Sign In")).toBeTruthy();
      expect(screen.queryByText("Sign In to Recidiviz")).toBeNull();
    });

    it("stays on the sign-in screen when authorize() rejects with a different error", async () => {
      mockAuthorize.mockRejectedValue(OTHER_ERROR);
      render(<LoginScreen />);

      fireEvent.press(screen.getByText("Continue"));

      await waitFor(() => expect(mockAuthorize).toHaveBeenCalled());
      expect(screen.getByText("Sign In to Recidiviz")).toBeTruthy();
    });
  });

  describe("web path: authorize() never settles, error surfaces via useAuth0().error", () => {
    it("shows the access-denied screen when `error` is access_denied, without any interaction", () => {
      // Matches the real web adapter: authorize() never resolves/rejects.
      mockAuthorize.mockReturnValue(new Promise(() => undefined));
      mockUseAuth0.mockReturnValue({
        authorize: mockAuthorize,
        error: ACCESS_DENIED_ERROR,
        clearCredentials: mockClearCredentials,
      });

      render(<LoginScreen />);

      expect(screen.getByText(ACCESS_DENIED_ERROR.message)).toBeTruthy();
      expect(screen.getByText("Back to Sign In")).toBeTruthy();
      expect(mockAuthorize).not.toHaveBeenCalled();
    });

    it("stays on the sign-in screen when `error` is a different Auth0 error", () => {
      mockUseAuth0.mockReturnValue({
        authorize: mockAuthorize,
        error: OTHER_ERROR,
        clearCredentials: mockClearCredentials,
      });

      render(<LoginScreen />);

      expect(screen.getByText("Sign In to Recidiviz")).toBeTruthy();
    });
  });

  it('returns to the sign-in screen and clears credentials when "Back to Sign In" is pressed', async () => {
    mockAuthorize.mockRejectedValue(ACCESS_DENIED_ERROR);
    render(<LoginScreen />);

    fireEvent.press(screen.getByText("Continue"));
    await waitFor(() =>
      expect(screen.getByText("Back to Sign In")).toBeTruthy(),
    );

    fireEvent.press(screen.getByText("Back to Sign In"));

    expect(mockClearCredentials).toHaveBeenCalled();
    expect(screen.getByText("Sign In to Recidiviz")).toBeTruthy();
  });
});
