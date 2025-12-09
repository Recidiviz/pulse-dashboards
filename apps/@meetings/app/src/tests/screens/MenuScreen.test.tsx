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

import { useNavigation } from "@react-navigation/native";
import { fireEvent, render, waitFor } from "@testing-library/react-native";

import MenuScreen from "../../screens/MenuScreen";

// Mock react-native-auth0
const mockClearSession = jest.fn();
const mockUseAuth0 = jest.fn();

jest.mock("react-native-auth0", () => ({
  useAuth0: () => mockUseAuth0(),
}));

// Mock navigation
const mockNavigate = jest.fn();
jest.mock("@react-navigation/native", () => ({
  useNavigation: jest.fn(),
}));

// Mock Icons
jest.mock("../../../assets/icons", () => ({
  Cross: { uri: "cross-icon" },
  Bell: { uri: "bell-icon" },
  BgAvatar: { uri: "bg-avatar" },
  Clients: { uri: "clients-icon" },
}));

// Mock MobileMenuItem
jest.mock("../../components/MobileMenuItem", () => {
  const React = require("react");
  const { Text, TouchableOpacity } = require("react-native");
  return function MobileMenuItem({
    title,
    onPress,
  }: {
    title: string;
    onPress?: () => void;
  }) {
    return (
      <TouchableOpacity onPress={onPress} testID={`menu-item-${title}`}>
        <Text>{title}</Text>
      </TouchableOpacity>
    );
  };
});

describe("MenuScreen", () => {
  const mockOnClose = jest.fn();

  beforeEach(() => {
    jest.clearAllMocks();
    (useNavigation as jest.Mock).mockReturnValue({
      navigate: mockNavigate,
    });
    // MenuScreen calls useAuth0 twice - once for clearSession, once for user
    // So we need to mock it to return the same value both times
    mockUseAuth0.mockReturnValue({
      clearSession: mockClearSession,
      user: null,
    });
  });

  describe("user data display", () => {
    it("displays user name and email when user data is available", () => {
      const userData = {
        name: "John Doe",
        email: "john.doe@example.com",
      };
      // MenuScreen calls useAuth0 twice, but both calls should return the same value
      mockUseAuth0.mockReturnValue({
        clearSession: mockClearSession,
        user: userData,
      });

      const { getByText } = render(<MenuScreen onClose={mockOnClose} />);

      const nameElement = getByText("John Doe");
      const emailElement = getByText("john.doe@example.com");
      expect(nameElement).toBeTruthy();
      expect(emailElement).toBeTruthy();
    });

    it("displays fallback values when user is null", () => {
      mockUseAuth0.mockReturnValue({
        clearSession: mockClearSession,
        user: null,
      });

      const { getByText } = render(<MenuScreen onClose={mockOnClose} />);

      const nameElement = getByText("User name not found");
      const emailElement = getByText("User email not found");
      expect(nameElement).toBeTruthy();
      expect(emailElement).toBeTruthy();
    });

    it("displays fallback name when user.name is undefined", () => {
      const userData = { email: "test@example.com" };
      mockUseAuth0.mockReturnValue({
        clearSession: mockClearSession,
        user: userData,
      });

      const { getByText } = render(<MenuScreen onClose={mockOnClose} />);

      const nameElement = getByText("User name not found");
      const emailElement = getByText("test@example.com");
      expect(nameElement).toBeTruthy();
      expect(emailElement).toBeTruthy();
    });

    it("displays fallback email when user.email is undefined", () => {
      const userData = { name: "Jane Smith" };
      mockUseAuth0.mockReturnValue({
        clearSession: mockClearSession,
        user: userData,
      });

      const { getByText } = render(<MenuScreen onClose={mockOnClose} />);

      const nameElement = getByText("Jane Smith");
      const emailElement = getByText("User email not found");
      expect(nameElement).toBeTruthy();
      expect(emailElement).toBeTruthy();
    });
  });

  describe("logout", () => {
    it("calls clearSession and logs out the user when logout is pressed", async () => {
      const userData = {
        name: "John Doe",
        email: "john.doe@example.com",
      };

      // Start with a logged-in user
      mockUseAuth0.mockReturnValue({
        clearSession: mockClearSession,
        user: userData,
      });

      // When clearSession is called, simulate logout by updating the mock
      mockClearSession.mockImplementation(async () => {
        // After logout, user should be null
        mockUseAuth0.mockReturnValue({
          clearSession: mockClearSession,
          user: null,
        });
        return undefined;
      });

      const { getByText, rerender } = render(
        <MenuScreen onClose={mockOnClose} />,
      );

      // Verify user is logged in initially
      expect(getByText("John Doe")).toBeTruthy();
      expect(getByText("john.doe@example.com")).toBeTruthy();

      // Press logout button
      const logoutButton = getByText("Log Out");
      fireEvent.press(logoutButton);

      // Wait for clearSession to complete
      await waitFor(() => {
        expect(mockClearSession).toHaveBeenCalledTimes(1);
      });

      // Re-render to reflect the logged-out state
      rerender(<MenuScreen onClose={mockOnClose} />);

      // Verify user is now logged out (shows fallback text)
      await waitFor(() => {
        expect(getByText("User name not found")).toBeTruthy();
        expect(getByText("User email not found")).toBeTruthy();
      });
    });
  });
});
