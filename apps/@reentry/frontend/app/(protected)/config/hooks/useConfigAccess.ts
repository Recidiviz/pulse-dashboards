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

"use client";

import { useCallback, useEffect, useState } from "react";

import { BACKEND_URL } from "~@reentry/frontend/constants";
import { useAuth } from "~@reentry/frontend/lib/auth/authContext";

const CONFIG_ACCESS_TOKEN_KEY = "config_access_token";
const CONFIG_ACCESS_EXPIRY_KEY = "config_access_expiry";

interface ConfigAccessState {
  /** Whether we're still checking the gate status */
  isLoading: boolean;
  /** Whether the password gate is enabled in this environment */
  isGateEnabled: boolean;
  /** Whether the user has a valid config access token */
  isUnlocked: boolean;
  /** Error message from last password attempt */
  error: string | null;
}

/**
 * Hook to manage config management password gate state.
 *
 * - Checks if the password gate is enabled in the current environment.
 * - Manages the config access token in sessionStorage.
 * - Provides a method to verify the password and obtain a token.
 */
export function useConfigAccess() {
  const auth = useAuth();
  const [state, setState] = useState<ConfigAccessState>({
    isLoading: true,
    isGateEnabled: false,
    isUnlocked: false,
    error: null,
  });

  // Check if we have a valid (non-expired) token in sessionStorage
  const checkStoredToken = useCallback((): boolean => {
    const token = sessionStorage.getItem(CONFIG_ACCESS_TOKEN_KEY);
    const expiryStr = sessionStorage.getItem(CONFIG_ACCESS_EXPIRY_KEY);
    if (!token || !expiryStr) return false;
    const expiry = parseInt(expiryStr, 10);
    if (Date.now() > expiry) {
      // Token expired, clean up
      sessionStorage.removeItem(CONFIG_ACCESS_TOKEN_KEY);
      sessionStorage.removeItem(CONFIG_ACCESS_EXPIRY_KEY);
      return false;
    }
    return true;
  }, []);

  // Check password gate status from backend
  useEffect(() => {
    let cancelled = false;

    async function checkGateStatus() {
      try {
        const accessToken = await auth.getAccessToken();
        if (!accessToken) return;

        const res = await fetch(
          `${BACKEND_URL}/config-management/auth/password-gate-status`,
          {
            headers: { Authorization: `Bearer ${accessToken}` },
          },
        );

        if (!cancelled && res.ok) {
          const data = await res.json();
          const gateEnabled = data.enabled === true;
          const hasValidToken = gateEnabled ? checkStoredToken() : false;

          setState({
            isLoading: false,
            isGateEnabled: gateEnabled,
            isUnlocked: !gateEnabled || hasValidToken,
            error: null,
          });
        } else if (!cancelled) {
          // If we can't check, assume no gate (fail open for UX)
          setState({
            isLoading: false,
            isGateEnabled: false,
            isUnlocked: true,
            error: null,
          });
        }
      } catch {
        if (!cancelled) {
          setState({
            isLoading: false,
            isGateEnabled: false,
            isUnlocked: true,
            error: null,
          });
        }
      }
    }

    if (!auth.state.isLoading) {
      checkGateStatus();
    }

    return () => {
      cancelled = true;
    };
  }, [auth, auth.state.isLoading, checkStoredToken]);

  // Verify password and store token
  const verifyPassword = useCallback(
    async (password: string): Promise<boolean> => {
      setState((prev) => ({ ...prev, error: null }));

      try {
        const accessToken = await auth.getAccessToken();
        if (!accessToken) {
          setState((prev) => ({
            ...prev,
            error: "Authentication required.",
          }));
          return false;
        }

        const res = await fetch(
          `${BACKEND_URL}/config-management/auth/verify-password`,
          {
            method: "POST",
            headers: {
              Authorization: `Bearer ${accessToken}`,
              "Content-Type": "application/json",
            },
            body: JSON.stringify({ password }),
          },
        );

        if (res.ok) {
          const data = await res.json();
          const expiresInMs = data.expires_in_minutes * 60 * 1000;
          // Store with a small buffer (1 minute early) to avoid edge cases
          const expiryTime = Date.now() + expiresInMs - 60_000;

          sessionStorage.setItem(CONFIG_ACCESS_TOKEN_KEY, data.token);
          sessionStorage.setItem(
            CONFIG_ACCESS_EXPIRY_KEY,
            expiryTime.toString(),
          );

          setState((prev) => ({ ...prev, isUnlocked: true, error: null }));
          return true;
        } else {
          const errorData = await res.json().catch(() => ({}));
          const detail =
            errorData.detail || "Incorrect password. Please try again.";
          setState((prev) => ({ ...prev, error: detail }));
          return false;
        }
      } catch {
        setState((prev) => ({
          ...prev,
          error: "Failed to verify password. Please try again.",
        }));
        return false;
      }
    },
    [auth],
  );

  // Clear the token (e.g. on explicit lock)
  const clearAccess = useCallback(() => {
    sessionStorage.removeItem(CONFIG_ACCESS_TOKEN_KEY);
    sessionStorage.removeItem(CONFIG_ACCESS_EXPIRY_KEY);
    setState((prev) => ({ ...prev, isUnlocked: false }));
  }, []);

  return {
    ...state,
    verifyPassword,
    clearAccess,
  };
}

/**
 * Get the config access token from sessionStorage.
 * Used by the API middleware to attach the header.
 */
export function getConfigAccessToken(): string | null {
  if (typeof window === "undefined") return null;
  const token = sessionStorage.getItem(CONFIG_ACCESS_TOKEN_KEY);
  const expiryStr = sessionStorage.getItem(CONFIG_ACCESS_EXPIRY_KEY);
  if (!token || !expiryStr) return null;
  const expiry = parseInt(expiryStr, 10);
  if (Date.now() > expiry) return null;
  return token;
}
