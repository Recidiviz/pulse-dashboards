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

import { getConfigAccessToken } from "../hooks/useConfigAccess";

/**
 * Build headers for config management fetch calls.
 * Includes the Auth0 bearer token and, if available, the config access token.
 */
export function configHeaders(accessToken: string | null | undefined): HeadersInit {
  const headers: Record<string, string> = {};
  if (accessToken) {
    headers["Authorization"] = `Bearer ${accessToken}`;
  }
  const configToken = getConfigAccessToken();
  if (configToken) {
    headers["X-Config-Access-Token"] = configToken;
  }
  return headers;
}
