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

import { render, screen } from "@testing-library/react-native";
import React from "react";

import DrawerNavigator from "../../app/navigation/DrawerNavigator";
import * as AgencyConfigContext from "../../context/AgencyConfigContext";
import * as StateContext from "../../context/StateContext";
import * as UserContext from "../../context/UserContext";
import * as UserModule from "../../entities/user";

// Mock useSetDocumentTitle hooks, since it modifies document.title, and it causes errors
jest.mock("../../shared/lib/useSetDocumentTitle", () => ({
  useSetDocumentTitle: () => null,
}));
// Mock AsyncStorage
jest.mock("@react-native-async-storage/async-storage", () =>
  require("@react-native-async-storage/async-storage/jest/async-storage-mock"),
);

// Mock react-native-auth0
jest.mock("react-native-auth0", () => ({
  useAuth0: jest.fn(),
}));

// Mock the Drawer Navigator to just render children - we only care about the logic in DrawerNavigator
jest.mock("@react-navigation/drawer", () => ({
  createDrawerNavigator: () => ({
    Navigator: ({ children }: { children: React.ReactNode }) => children,
    Screen: () => null,
  }),
}));

// Mock all screen components since they import native modules
jest.mock("../../pages/clients", () => null);
jest.mock("../../pages/residents", () => null);
jest.mock("~@meetings/app/pages/state-selection", () => ({
  StateSelectionScreen: null,
}));
jest.mock("../../pages/client-profile", () => null);
jest.mock("../../pages/resident-profile", () => null);
jest.mock("../../pages/client-meeting", () => null);
jest.mock("../../pages/resident-meeting", () => null);
jest.mock("../../screens/ClientNewMeetingScreen", () => null);
jest.mock("../../screens/ResidentNewMeetingScreen", () => null);
jest.mock("../../components/DrawerContent", () => null);
jest.mock("../../pages/onboarding", () => ({
  OnboardingScreen: null,
}));

jest.mock("../../entities/user", () => ({
  useGetUser: jest.fn(),
}));

describe("DrawerNavigator", () => {
  const mockUseUserContext = jest.spyOn(UserContext, "useUserContext");
  const mockUseStateSelection = jest.spyOn(StateContext, "useStateSelection");
  const mockUseAgencyConfigs = jest.spyOn(
    AgencyConfigContext,
    "useAgencyConfigs",
  );
  const mockUseGetUser = UserModule.useGetUser as jest.Mock;

  mockUseAgencyConfigs.mockReturnValue({
    agencyConfigs: {
      US_NE: {
        name: "Nebraska",
        stateCode: "US_NE",
        version: 1,
        baseVersion: 1,
      },
    } as never,
    isLoading: false,
  });

  mockUseGetUser.mockReturnValue({
    data: { email: "test@example.com", hasSeenOnboarding: true },
    isLoading: false,
  } as never);

  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe("loading states", () => {
    it("shows loading when user context is loading", () => {
      mockUseUserContext.mockReturnValue({
        hasSupervisionAccess: false,
        hasFacilitiesAccess: false,
        hasSupervisionAssistantAccess: false,
        hasFacilitiesAssistantAccess: false,
        hasCasePlanningAssistantAccess: false,
        isLoading: true,
        stateCode: undefined,
        isSkipAuthUser: false,
        recidivizAllowedStates: [],
        onLogout: jest.fn(),
        getCredentials: jest.fn(),
        isRecidivizUser: false,
      });
      mockUseStateSelection.mockReturnValue({
        isLoading: false,
        selectedStateCode: "US_NE",
        setSelectedStateCode: jest.fn(),
        canSelectStateCode: false,
        currentStateName: "Nebraska",
      });

      render(<DrawerNavigator />);
      expect(screen.getByText("Loading...")).toBeTruthy();
    });

    it("shows loading when state context is loading", () => {
      mockUseUserContext.mockReturnValue({
        hasSupervisionAccess: true,
        hasFacilitiesAccess: false,
        hasSupervisionAssistantAccess: false,
        hasFacilitiesAssistantAccess: false,
        hasCasePlanningAssistantAccess: false,
        isLoading: false,
        stateCode: "US_NE",
        isSkipAuthUser: false,
        recidivizAllowedStates: ["US_NE"],
        onLogout: jest.fn(),
        getCredentials: jest.fn(),
        isRecidivizUser: false,
      });
      mockUseStateSelection.mockReturnValue({
        isLoading: true,
        selectedStateCode: "US_NE",
        setSelectedStateCode: jest.fn(),
        canSelectStateCode: false,
        currentStateName: "Nebraska",
      });

      render(<DrawerNavigator />);
      expect(screen.getByText("Loading...")).toBeTruthy();
    });
  });

  describe("unsupported state code", () => {
    it("shows NoAccessScreen for state user with unsupported state code", () => {
      mockUseUserContext.mockReturnValue({
        hasSupervisionAccess: true,
        hasFacilitiesAccess: false,
        hasSupervisionAssistantAccess: false,
        hasFacilitiesAssistantAccess: false,
        hasCasePlanningAssistantAccess: false,
        isLoading: false,
        stateCode: "US_TX", // Texas is not in AVAILABLE_STATE_CODES
        isSkipAuthUser: false,
        recidivizAllowedStates: ["US_TX"],
        onLogout: jest.fn(),
        getCredentials: jest.fn(),
        isRecidivizUser: false,
      });
      mockUseStateSelection.mockReturnValue({
        isLoading: false,
        selectedStateCode: "US_NE",
        setSelectedStateCode: jest.fn(),
        canSelectStateCode: false,
        currentStateName: "Nebraska",
      });

      render(<DrawerNavigator />);
      expect(screen.getByText("Access Denied")).toBeTruthy();
    });

    it("does not show NoAccessScreen for Recidiviz user regardless of state code", () => {
      mockUseUserContext.mockReturnValue({
        hasSupervisionAccess: true,
        hasFacilitiesAccess: true,
        hasSupervisionAssistantAccess: false,
        hasFacilitiesAssistantAccess: false,
        hasCasePlanningAssistantAccess: false,
        isLoading: false,
        stateCode: "recidiviz",
        isSkipAuthUser: false,
        recidivizAllowedStates: ["US_NE", "US_ME", "US_NC"],
        onLogout: jest.fn(),
        getCredentials: jest.fn(),
        isRecidivizUser: false,
      });
      mockUseStateSelection.mockReturnValue({
        isLoading: false,
        selectedStateCode: "US_NE",
        setSelectedStateCode: jest.fn(),
        canSelectStateCode: true,
        currentStateName: "Nebraska",
      });

      render(<DrawerNavigator />);
      expect(screen.queryByText("Access Denied")).toBeFalsy();
    });

    it("does not show NoAccessScreen for state user with supported state code", () => {
      mockUseUserContext.mockReturnValue({
        hasSupervisionAccess: true,
        hasFacilitiesAccess: false,
        hasSupervisionAssistantAccess: false,
        hasFacilitiesAssistantAccess: false,
        hasCasePlanningAssistantAccess: false,
        isLoading: false,
        stateCode: "US_NE", // Nebraska is supported
        isSkipAuthUser: false,
        recidivizAllowedStates: ["US_NE"],
        onLogout: jest.fn(),
        getCredentials: jest.fn(),
        isRecidivizUser: false,
      });
      mockUseStateSelection.mockReturnValue({
        isLoading: false,
        selectedStateCode: "US_NE",
        setSelectedStateCode: jest.fn(),
        canSelectStateCode: false,
        currentStateName: "Nebraska",
      });

      render(<DrawerNavigator />);
      expect(screen.queryByText("Access Denied")).toBeFalsy();
    });

    it("handles lowercase state codes correctly", () => {
      mockUseUserContext.mockReturnValue({
        hasSupervisionAccess: true,
        hasFacilitiesAccess: false,
        hasSupervisionAssistantAccess: false,
        hasFacilitiesAssistantAccess: false,
        hasCasePlanningAssistantAccess: false,
        isLoading: false,
        stateCode: "us_ne", // lowercase but should still match
        isSkipAuthUser: false,
        recidivizAllowedStates: ["us_ne"],
        onLogout: jest.fn(),
        getCredentials: jest.fn(),
        isRecidivizUser: false,
      });
      mockUseStateSelection.mockReturnValue({
        isLoading: false,
        selectedStateCode: "US_NE",
        setSelectedStateCode: jest.fn(),
        canSelectStateCode: false,
        currentStateName: "Nebraska",
      });

      render(<DrawerNavigator />);
      expect(screen.queryByText("Access Denied")).toBeFalsy();
    });
  });

  describe("route access control", () => {
    it("shows NoAccessScreen when user has no route access", () => {
      mockUseUserContext.mockReturnValue({
        hasSupervisionAccess: false,
        hasFacilitiesAccess: false,
        hasSupervisionAssistantAccess: false,
        hasFacilitiesAssistantAccess: false,
        hasCasePlanningAssistantAccess: false,
        isLoading: false,
        stateCode: "US_NE",
        isSkipAuthUser: false,
        recidivizAllowedStates: ["US_NE"],
        onLogout: jest.fn(),
        getCredentials: jest.fn(),
        isRecidivizUser: false,
      });
      mockUseStateSelection.mockReturnValue({
        isLoading: false,
        selectedStateCode: "US_NE",
        setSelectedStateCode: jest.fn(),
        canSelectStateCode: false,
        currentStateName: "Nebraska",
      });

      render(<DrawerNavigator />);
      expect(screen.getByText("Access Denied")).toBeTruthy();
    });
  });
});
