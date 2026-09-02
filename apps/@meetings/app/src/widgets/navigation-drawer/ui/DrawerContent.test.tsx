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

import { DrawerContentComponentProps } from "@react-navigation/drawer";
import { render, screen } from "@testing-library/react-native";
import React from "react";

import { useStateSelection } from "~@meetings/app/entities/state-code";
import { useUserContext } from "~@meetings/app/entities/user";
import { usePlatform } from "~@meetings/app/shared/lib/platform";

import { DrawerContent } from "./DrawerContent";

// DrawerContentScrollView needs a real drawer navigation context to render, so
// stand it in with a plain passthrough — these tests are about which menu
// entries appear, not about the scroll container.
jest.mock("@react-navigation/drawer", () => {
  const { View } = jest.requireActual("react-native");
  return {
    DrawerContentScrollView: ({ children }: { children: React.ReactNode }) => (
      <View>{children}</View>
    ),
  };
});

jest.mock("react-native-safe-area-context", () => ({
  useSafeAreaInsets: () => ({ top: 0, bottom: 0, left: 0, right: 0 }),
}));

jest.mock("~@meetings/app/entities/state-code", () => ({
  useStateSelection: jest.fn(),
}));

jest.mock("~@meetings/app/entities/user", () => ({
  useUserContext: jest.fn(),
}));

jest.mock("~@meetings/app/shared/lib/platform", () => ({
  usePlatform: jest.fn(),
}));

describe("DrawerContent", () => {
  const mockUseStateSelection = useStateSelection as jest.Mock;
  const mockUseUserContext = useUserContext as jest.Mock;
  const mockUsePlatform = usePlatform as jest.Mock;

  const props = {
    navigation: {
      navigate: jest.fn(),
      closeDrawer: jest.fn(),
    },
  } as unknown as DrawerContentComponentProps;

  beforeEach(() => {
    jest.clearAllMocks();

    mockUseStateSelection.mockReturnValue({
      canSelectStateCode: false,
      currentStateName: "Nebraska",
    });
    mockUseUserContext.mockReturnValue({
      name: "Test User",
      email: "test@example.com",
      // Both false so no MobileMenuItem renders — those use `Link`, which needs
      // a NavigationContainer theme. These tests cover the text entries only.
      hasSupervisionAccess: false,
      hasFacilitiesAccess: false,
      onLogout: jest.fn(),
      isRecidivizUser: true,
    });
    mockUsePlatform.mockReturnValue({ isWeb: false, isMobile: true });
  });

  // The agency config screen renders a Monaco editor, which is DOM-based and
  // throws an Invariant Violation on native (Sentry MEETINGS-APP-16A).
  describe("agency config entry", () => {
    it("is hidden from Recidiviz users on native", () => {
      render(<DrawerContent {...props} />);

      expect(screen.queryByText("Agency Configurations")).toBeFalsy();
    });

    it("is shown to Recidiviz users on web", () => {
      mockUsePlatform.mockReturnValue({ isWeb: true, isMobile: false });

      render(<DrawerContent {...props} />);

      expect(screen.queryByText("Agency Configurations")).toBeTruthy();
    });

    it("is hidden from non-Recidiviz users on web", () => {
      mockUsePlatform.mockReturnValue({ isWeb: true, isMobile: false });
      mockUseUserContext.mockReturnValue({
        name: "Test User",
        email: "test@example.com",
        hasSupervisionAccess: false,
        hasFacilitiesAccess: false,
        onLogout: jest.fn(),
        isRecidivizUser: false,
      });

      render(<DrawerContent {...props} />);

      expect(screen.queryByText("Agency Configurations")).toBeFalsy();
    });
  });

  it("renders the log out entry on every platform", () => {
    render(<DrawerContent {...props} />);

    expect(screen.getByText("Log Out")).toBeTruthy();
  });
});
