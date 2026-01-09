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

/**
 * Hook to retrieve the client authentication token from sessionStorage.
 * This token is specifically for intake/client-side authentication flows.
 *
 * @returns The intake authentication token or an empty string if not available
 */
export const useClientAuthToken = () => {
  const getClientAuthToken = () => {
    // Get token from sessionStorage where it's stored for intake authentication
    if (typeof window !== "undefined") {
      return sessionStorage.getItem("intake_token") || "";
    }
    return "";
  };

  return { getClientAuthToken };
};
