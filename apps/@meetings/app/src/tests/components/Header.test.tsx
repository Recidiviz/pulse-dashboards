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

import {
  NavigationContainer,
  useNavigation,
  useRoute,
} from "@react-navigation/native";
import { fireEvent, render, waitFor } from "@testing-library/react-native";
import React from "react";

import Header from "../../components/Header";
import { StateCode, StateCodeProvider } from "../../context/StateContext";
import { UserContextProvider } from "../../context/UserContext";

jest.mock("../../context/AgencyConfigContext", () => ({
  useAgencyConfigs: () => ({ agencyConfigs: {}, isLoading: false }),
  AgencyConfigProvider: ({ children }: { children: React.ReactNode }) =>
    children,
}));

jest.mock("react-native", () => {
  const RN = jest.requireActual("react-native");
  RN.Platform.OS = "web";
  RN.Platform.select = (objs: Record<string, unknown>) =>
    objs["web"] || objs["default"];
  return RN;
});

// Mock react-native-auth0
const mockClearSession = jest.fn();
const mockGetCredentials = jest.fn();
jest.mock("react-native-auth0", () => ({
  useAuth0: () => ({
    user: {
      name: "Test User",
      "https://dashboard.recidiviz.org/app_metadata": {
        stateCode: "US_NE",
        pseudonymizedId: "test-pid",
      },
    },
    isLoading: false,
    clearSession: mockClearSession,
    getCredentials: mockGetCredentials,
  }),
}));

// Mock navigation
const mockNavigate = jest.fn();
const mockRoute = {
  name: "ClientsRoot" as const,
  params: { screen: "Clients" },
};

jest.mock("@react-navigation/native", () => {
  const originalModule = jest.requireActual("@react-navigation/native");

  return {
    ...originalModule,
    useNavigation: jest.fn(),
    useRoute: jest.fn(),
  };
});

// Mock AsyncStorage
// https://react-native-async-storage.github.io/2.0/advanced/Jest-integration/
jest.mock("@react-native-async-storage/async-storage", () =>
  require("@react-native-async-storage/async-storage/jest/async-storage-mock"),
);

jest.mock("../../components/ImpersonationModal", () => ({
  ImpersonationModal: () => null,
}));

jest.mock("../../hooks/useImpersonationStore", () => ({
  useImpersonationStore: () => ({
    impersonatedEmail: "",
    impersonatedStateCode: "",
    startImpersonating: jest.fn(),
    stopImpersonating: jest.fn(),
  }),
}));

jest.mock("../../shared/ui/OfflineIndicator", () => ({
  OfflineIndicator: () => <div>Mocked Indicator</div>,
}));
jest.mock("../../features/recording", () => ({
  useRecording: () => ({
    status: "idle",
  }),
}));

describe("Header", () => {
  beforeEach(() => {
    jest.clearAllMocks();
    (useNavigation as jest.Mock).mockReturnValue({
      navigate: mockNavigate,
    });
    (useRoute as jest.Mock).mockReturnValue(mockRoute);
  });

  const selectedStateRef = React.createRef<StateCode>();
  selectedStateRef.current = "US_NE";

  describe("navigation changes", () => {
    it("navigates to Clients when logo is pressed (changed from Home)", async () => {
      const { getByTestId } = render(
        <UserContextProvider isSkipAuthUser={false}>
          <StateCodeProvider selectedStateRef={selectedStateRef}>
            <NavigationContainer>
              <Header />
            </NavigationContainer>
          </StateCodeProvider>
        </UserContextProvider>,
      );

      // Wait for StateCodeProvider's async initialization to complete
      await waitFor(() => {
        expect(getByTestId("logo-button")).toBeTruthy();
      });

      const logoButton = getByTestId("logo-button");
      fireEvent.press(logoButton);

      expect(mockNavigate).toHaveBeenCalledWith("ClientsRoot", {
        screen: "Clients",
      });
    });
  });
});
