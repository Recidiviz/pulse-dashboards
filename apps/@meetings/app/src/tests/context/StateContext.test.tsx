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

import { renderHook } from "@testing-library/react-native";
import React from "react";

import * as AgencyConfigContext from "../../context/AgencyConfigContext";
import {
  DEFAULT_STATE_CODE,
  StateCodeProvider,
  useStateSelection,
} from "../../context/StateContext";
import * as UserContext from "../../context/UserContext";

jest.mock("@react-native-async-storage/async-storage", () =>
  require("@react-native-async-storage/async-storage/jest/async-storage-mock"),
);

const mockUseUserContext = jest.spyOn(UserContext, "useUserContext");
const mockUseAgencyConfigs = jest.spyOn(
  AgencyConfigContext,
  "useAgencyConfigs",
);

const baseUserContext: ReturnType<typeof UserContext.useUserContext> = {
  isLoading: false,
  stateCode: "US_NE",
  isSkipAuthUser: false,
  recidivizAllowedStates: ["US_NE"],
  hasSupervisionAccess: true,
  hasFacilitiesAccess: false,
  hasSupervisionAssistantAccess: false,
  hasFacilitiesAssistantAccess: false,
  hasCasePlanningAssistantAccess: false,
  onLogout: jest.fn(),
  getCredentials: jest.fn(),
};

const agencyConfigs = {
  US_NE: { stateCode: "US_NE", name: "Nebraska", version: 1, baseVersion: 1 },
  US_DEMO: { stateCode: "US_DEMO", name: "Demo", version: 1, baseVersion: 1 },
} as never;

beforeEach(() => {
  jest.clearAllMocks();
  mockUseAgencyConfigs.mockReturnValue({ agencyConfigs, isLoading: false });
});

function makeWrapper(selectedStateRef: React.RefObject<string | null>) {
  return ({ children }: { children: React.ReactNode }) => (
    <StateCodeProvider selectedStateRef={selectedStateRef}>
      {children}
    </StateCodeProvider>
  );
}

describe("StateCodeProvider", () => {
  describe("selectedStateRef initialization", () => {
    it("sets ref to user state code on first render for a state user", () => {
      mockUseUserContext.mockReturnValue({
        ...baseUserContext,
        stateCode: "US_NE",
        recidivizAllowedStates: ["US_NE"],
      });
      const ref = React.createRef<string | null>();

      renderHook(() => useStateSelection(), { wrapper: makeWrapper(ref) });

      expect(ref.current).toBe("US_NE");
    });

    it("sets ref to US_DEMO for a US_DEMO state user", () => {
      mockUseUserContext.mockReturnValue({
        ...baseUserContext,
        stateCode: "US_DEMO",
        recidivizAllowedStates: ["US_DEMO"],
      });
      const ref = React.createRef<string | null>();

      renderHook(() => useStateSelection(), { wrapper: makeWrapper(ref) });

      expect(ref.current).toBe("US_DEMO");
    });

    it("normalizes lowercase state code to uppercase", () => {
      mockUseUserContext.mockReturnValue({
        ...baseUserContext,
        stateCode: "us_ne",
        recidivizAllowedStates: ["us_ne"],
      });
      const ref = React.createRef<string | null>();

      renderHook(() => useStateSelection(), { wrapper: makeWrapper(ref) });

      expect(ref.current).toBe("US_NE");
    });

    it("keeps default state code for Recidiviz users", () => {
      mockUseUserContext.mockReturnValue({
        ...baseUserContext,
        stateCode: "recidiviz",
        recidivizAllowedStates: ["US_NE", "US_DEMO", "US_ME"],
      });
      const ref = React.createRef<string | null>();

      renderHook(() => useStateSelection(), { wrapper: makeWrapper(ref) });

      expect(ref.current).toBe(DEFAULT_STATE_CODE);
    });

    it("keeps default state code for skip auth users", () => {
      mockUseUserContext.mockReturnValue({
        ...baseUserContext,
        stateCode: "US_NE",
        isSkipAuthUser: true,
        recidivizAllowedStates: [],
      });
      const ref = React.createRef<string | null>();

      renderHook(() => useStateSelection(), { wrapper: makeWrapper(ref) });

      expect(ref.current).toBe(DEFAULT_STATE_CODE);
    });
  });

  describe("selectedStateCode initial value", () => {
    it("exposes the user state code immediately (before async effect) for state users", () => {
      mockUseUserContext.mockReturnValue({
        ...baseUserContext,
        stateCode: "US_DEMO",
        recidivizAllowedStates: ["US_DEMO"],
      });
      const ref = React.createRef<string | null>();

      const { result } = renderHook(() => useStateSelection(), {
        wrapper: makeWrapper(ref),
      });

      expect(result.current.selectedStateCode).toBe("US_DEMO");
    });
  });
});
