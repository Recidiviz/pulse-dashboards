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

import { renderHook, waitFor } from "@testing-library/react-native";
import React from "react";
import { useAuth0 } from "react-native-auth0";

import { UserContextProvider, useUserContext } from "../../context/UserContext";

// Mock AsyncStorage
jest.mock("@react-native-async-storage/async-storage", () =>
  require("@react-native-async-storage/async-storage/jest/async-storage-mock"),
);

// Mock react-native-auth0
const mockGetCredentials = jest.fn();
const mockClearSession = jest.fn();
const mockUser = {
  name: "Test User",
  email: "test@example.com",
  "https://dashboard.recidiviz.org/app_metadata": {
    stateCode: "US_ND",
    pseudonymizedId: "test-pid-123",
    routes: {
      meetingsSupervision: true,
      meetingsFacilities: false,
    },
  },
};

jest.mock("react-native-auth0", () => ({
  useAuth0: jest.fn(),
}));
const mockUseAuth0 = useAuth0 as jest.Mock;

describe("UserContext", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe("useUserContext", () => {
    it("throws error when used outside of provider", () => {
      // Suppress console.error for this test
      const consoleSpy = jest.spyOn(console, "error").mockImplementation(() => {
        /* do nothing */
      });

      expect(() => {
        renderHook(() => useUserContext());
      }).toThrow("useUserContext must be used within a UserContextProvider");

      consoleSpy.mockRestore();
    });
  });

  describe("UserContextProvider - skip auth mode", () => {
    it("provides skip auth user context", () => {
      mockUseAuth0.mockReturnValue({
        user: null,
        isLoading: false,
        getCredentials: mockGetCredentials,
        clearSession: mockClearSession,
      });

      const wrapper = ({ children }: { children: React.ReactNode }) => (
        <UserContextProvider isSkipAuthUser={true}>
          {children}
        </UserContextProvider>
      );

      const { result } = renderHook(() => useUserContext(), { wrapper });

      expect(result.current).toMatchObject({
        isLoading: false,
        stateCode: "US_NE",
        pseudonymizedId: "staff-pid-1",
        isSkipAuthUser: true,
        hasSupervisionAccess: true,
        hasFacilitiesAccess: true,
      });
      expect(result.current.recidivizAllowedStates.length).toBeGreaterThan(0);
    });
  });

  describe("UserContextProvider - authenticated mode", () => {
    it("provides authenticated user context with state user", async () => {
      mockUseAuth0.mockReturnValue({
        user: mockUser,
        isLoading: false,
        getCredentials: mockGetCredentials,
        clearSession: mockClearSession,
      });

      const wrapper = ({ children }: { children: React.ReactNode }) => (
        <UserContextProvider isSkipAuthUser={false}>
          {children}
        </UserContextProvider>
      );

      const { result } = renderHook(() => useUserContext(), { wrapper });

      await waitFor(() => {
        expect(result.current.isLoading).toBe(false);
      });

      expect(result.current).toMatchObject({
        name: "Test User",
        email: "test@example.com",
        stateCode: "US_ND",
        pseudonymizedId: "test-pid-123",
        isSkipAuthUser: false,
        recidivizAllowedStates: ["US_ND"],
        hasSupervisionAccess: true,
        hasFacilitiesAccess: false,
      });
      expect(result.current.getCredentials).toBe(mockGetCredentials);
    });

    it("provides authenticated user context with recidiviz user", async () => {
      const recidivizUser = {
        ...mockUser,
        "https://dashboard.recidiviz.org/app_metadata": {
          stateCode: "recidiviz",
          pseudonymizedId: "recidiviz-pid-456",
          allowedStates: ["US_ND", "US_PA", "US_TN"],
        },
      };

      mockUseAuth0.mockReturnValue({
        user: recidivizUser,
        isLoading: false,
        getCredentials: mockGetCredentials,
        clearSession: mockClearSession,
      });

      const wrapper = ({ children }: { children: React.ReactNode }) => (
        <UserContextProvider isSkipAuthUser={false}>
          {children}
        </UserContextProvider>
      );

      const { result } = renderHook(() => useUserContext(), { wrapper });

      await waitFor(() => {
        expect(result.current.isLoading).toBe(false);
      });

      expect(result.current).toMatchObject({
        stateCode: "recidiviz",
        pseudonymizedId: "recidiviz-pid-456",
        isSkipAuthUser: false,
        recidivizAllowedStates: ["US_ND", "US_PA", "US_TN"],
        hasSupervisionAccess: true,
        hasFacilitiesAccess: true,
      });
    });

    it("shows loading state when app_metadata is not yet loaded", () => {
      const userWithoutMetadata = {
        name: "Test User",
        email: "test@example.com",
      };

      mockUseAuth0.mockReturnValue({
        user: userWithoutMetadata,
        isLoading: false,
        getCredentials: mockGetCredentials,
        clearSession: mockClearSession,
      });

      const wrapper = ({ children }: { children: React.ReactNode }) => (
        <UserContextProvider isSkipAuthUser={false}>
          {children}
        </UserContextProvider>
      );

      const { result } = renderHook(() => useUserContext(), { wrapper });

      expect(result.current.isLoading).toBe(true);
    });

    it("calls getCredentials on mount to populate app_metadata", () => {
      mockUseAuth0.mockReturnValue({
        user: mockUser,
        isLoading: false,
        getCredentials: mockGetCredentials,
        clearSession: mockClearSession,
      });

      const wrapper = ({ children }: { children: React.ReactNode }) => (
        <UserContextProvider isSkipAuthUser={false}>
          {children}
        </UserContextProvider>
      );

      renderHook(() => useUserContext(), { wrapper });

      expect(mockGetCredentials).toHaveBeenCalledWith(undefined, undefined, {
        audience: expect.any(String),
      });
    });

    it("calls clearSession when onLogout is called", async () => {
      mockUseAuth0.mockReturnValue({
        user: mockUser,
        isLoading: false,
        getCredentials: mockGetCredentials,
        clearSession: mockClearSession,
      });

      const wrapper = ({ children }: { children: React.ReactNode }) => (
        <UserContextProvider isSkipAuthUser={false}>
          {children}
        </UserContextProvider>
      );

      const { result } = renderHook(() => useUserContext(), { wrapper });

      await waitFor(() => {
        expect(result.current.isLoading).toBe(false);
      });

      await result.current.onLogout();

      expect(mockClearSession).toHaveBeenCalled();
    });

    it("handles user with no stateCode", async () => {
      const userWithNoStateCode = {
        ...mockUser,
        "https://dashboard.recidiviz.org/app_metadata": {
          pseudonymizedId: "test-pid-789",
        },
      };

      mockUseAuth0.mockReturnValue({
        user: userWithNoStateCode,
        isLoading: false,
        getCredentials: mockGetCredentials,
        clearSession: mockClearSession,
      });

      const wrapper = ({ children }: { children: React.ReactNode }) => (
        <UserContextProvider isSkipAuthUser={false}>
          {children}
        </UserContextProvider>
      );

      const { result } = renderHook(() => useUserContext(), { wrapper });

      await waitFor(() => {
        expect(result.current.isLoading).toBe(false);
      });

      expect(result.current.recidivizAllowedStates).toEqual([]);
      expect(result.current.hasSupervisionAccess).toBe(false);
      expect(result.current.hasFacilitiesAccess).toBe(false);
    });
  });
});
