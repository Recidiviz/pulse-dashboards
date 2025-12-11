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

import { useNavigation, useRoute } from "@react-navigation/native";
import { fireEvent, render } from "@testing-library/react-native";
import React from "react";

import Header from "../../components/Header";

// Mock react-native-auth0
const mockClearSession = jest.fn();
jest.mock("react-native-auth0", () => ({
  useAuth0: () => ({
    clearSession: mockClearSession,
  }),
}));

// Mock navigation
const mockNavigate = jest.fn();
const mockRoute = {
  name: "Clients" as const,
  params: undefined,
};

jest.mock("@react-navigation/native", () => ({
  useNavigation: jest.fn(),
  useRoute: jest.fn(),
}));

// Mock MenuScreen
jest.mock("../../screens/MenuScreen", () => {
  const { View, Text } = require("react-native");
  return function MenuScreen({ onClose }: { onClose: () => void }) {
    return (
      <View testID="menu-screen">
        <Text testID="menu-screen-close" onPress={onClose}>
          Close Menu
        </Text>
      </View>
    );
  };
});

// Mock Icons
jest.mock("../../../assets/icons", () => ({
  Menu: { uri: "menu-icon" },
  Bell: { uri: "bell-icon" },
  Brand: { uri: "brand-icon" },
  BgAvatar: { uri: "bg-avatar" },
  ArrowUp: { uri: "arrow-up" },
  ArrowDown: { uri: "arrow-down" },
}));

describe("Header", () => {
  beforeEach(() => {
    jest.clearAllMocks();
    (useNavigation as jest.Mock).mockReturnValue({
      navigate: mockNavigate,
    });
    (useRoute as jest.Mock).mockReturnValue(mockRoute);
  });

  describe("navigation changes", () => {
    it("navigates to Clients when logo is pressed (changed from Home)", () => {
      const { getByTestId } = render(<Header />);

      const logoButton = getByTestId("logo-button");
      fireEvent.press(logoButton);

      expect(mockNavigate).toHaveBeenCalledWith("Clients");
    });
  });
});
