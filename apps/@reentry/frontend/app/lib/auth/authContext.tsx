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

"use client";

import { AuthStore } from "@recidiviz/auth";
import React, {
  createContext,
  type ReactNode,
  useContext,
  useEffect,
  useState,
} from "react";

import { getAuthSettings } from "./authConfig";
import type { AuthContextType, AuthState } from "./types";

// Create the auth context with default values
const AuthContext = createContext<AuthContextType>({
  authStore: null,
  state: {
    isAuthorized: false,
    isLoading: true,
    error: null,
  },
  // eslint-disable-next-line @typescript-eslint/no-empty-function
  login: async () => {},
  // eslint-disable-next-line @typescript-eslint/no-empty-function
  logout: async () => {},
  getAccessToken: () => null,
  // eslint-disable-next-line @typescript-eslint/no-empty-function
  refreshToken: async () => {},
});

export const useAuth = () => useContext(AuthContext);

interface AuthProviderProps {
  children: ReactNode;
}

export const AuthProvider = ({ children }: AuthProviderProps) => {
  const [authStore, setAuthStore] = useState<AuthStore | null>(null);
  const [state, setState] = useState<AuthState>({
    isAuthorized: false,
    isLoading: true,
    error: null,
    accessToken: null,
  });

  // Initialize the auth store
  useEffect(() => {
    if (typeof window === "undefined") return;

    const initAuth = async () => {
      try {
        console.log("Initializing Auth Store...");
        const authSettings = getAuthSettings();
        const store = new AuthStore({ authSettings });

        setAuthStore(store);

        // Check authentication status on init (useful for page refresh)
        if (window.location.pathname !== "/auth/callback") {
          // eslint-disable-next-line no-use-before-define
          await checkAuthentication(store);
        }
      } catch (error) {
        console.error("Error initializing authentication:", error);
        setState((prev) => ({
          ...prev,
          isLoading: false,
          error:
            error instanceof Error
              ? error
              : new Error("Unknown error initializing Auth0"),
        }));
      }
    };

    initAuth();
  }, []);

  // Fetch and update the token when authentication state changes
  const fetchAndUpdateToken = async () => {
    try {
      if (!authStore) return;

      const token = await authStore.getTokenSilently();
      setState((prev) => ({
        ...prev,
        accessToken: token,
      }));
    } catch (error) {
      console.error("Error fetching token:", error);
      setState((prev) => ({
        ...prev,
        accessToken: null,
      }));
    }
  };

  useEffect(() => {
    if (state.isAuthorized && authStore) {
      fetchAndUpdateToken();
    }
  }, [state.isAuthorized, authStore]);

  // Helper function to check authentication status
  const checkAuthentication = async (store: AuthStore) => {
    try {
      console.log("Checking authentication status...");
      // @ts-expect-error ported from old codebase
      const isAuthenticated = await store.checkForAuthentication();
      console.log(
        "Authentication check complete. Authenticated:",
        isAuthenticated,
      );

      setState({
        isAuthorized: isAuthenticated,
        isLoading: false,
        user: store.user,
        emailVerified: store.emailVerified,
        error: null,
      });

      return isAuthenticated;
    } catch (error) {
      console.error("Authentication check failed:", error);
      setState({
        isAuthorized: false,
        isLoading: false,
        error:
          error instanceof Error
            ? error
            : new Error("Unknown error during authentication check"),
      });
      return false;
    }
  };

  // Login function
  const login = async () => {
    if (!authStore) {
      setState((prev) => ({
        ...prev,
        error: new Error("Auth store not initialized"),
      }));
      return;
    }

    try {
      setState((prev) => ({ ...prev, isLoading: true, error: null }));
      // @ts-expect-error ported from old codebase
      await authStore.loginWithRedirect();
    } catch (error) {
      console.error("Login error:", error);
      setState((prev) => ({
        ...prev,
        isLoading: false,
        error:
          error instanceof Error ? error : new Error("Unknown login error"),
      }));
    }
  };

  // Logout function
  const logout = async () => {
    if (!authStore) return;

    try {
      setState((prev) => ({ ...prev, isLoading: true }));
      await authStore.logout();

      // Reset state after logout
      setState({
        isAuthorized: false,
        isLoading: false,
        user: undefined,
        emailVerified: undefined,
        error: null,
      });
    } catch (error) {
      console.error("Logout error:", error);
      setState((prev) => ({
        ...prev,
        isLoading: false,
        error:
          error instanceof Error ? error : new Error("Unknown logout error"),
      }));
    }
  };

  const getAccessToken = (): string | null | undefined => {
    return state.accessToken;
  };

  const refreshToken = async (): Promise<void> => {
    await fetchAndUpdateToken();
  };

  return (
    <AuthContext.Provider
      value={{
        authStore,
        state,
        login,
        logout,
        getAccessToken,
        refreshToken,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};
