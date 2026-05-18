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

import { globalAuthStore } from "./globalAuthStore";

// Builds request headers with Authorization and, when impersonation is active,
// X-Impersonated-Email. Caller-supplied headers are preserved; auth headers
// are merged on top so they cannot be accidentally overridden.
async function buildAuthHeaders(
  init?: RequestInit,
  token?: string | null,
): Promise<Record<string, string>> {
  const resolvedToken = token ?? (await globalAuthStore.getCachedToken());
  const impersonatedEmail =
    typeof window !== "undefined"
      ? localStorage.getItem("impersonated_email")
      : null;

  return {
    ...(init?.headers as Record<string, string> | undefined),
    ...(resolvedToken ? { Authorization: `Bearer ${resolvedToken}` } : {}),
    ...(impersonatedEmail ? { "X-Impersonated-Email": impersonatedEmail } : {}),
  };
}

/**
 * Drop-in replacement for raw fetch() on backend API calls.
 *
 * Mirrors authMiddleware behavior:
 *  - Injects Authorization from globalAuthStore (shared with $api)
 *  - Injects X-Impersonated-Email when impersonation is active
 *  - Retries once on 401 with a fresh token (same as authMiddleware.onResponse)
 *
 * Use this instead of raw fetch() for any direct backend call so auth and
 * impersonation context are never accidentally dropped.
 */
export async function fetchWithAuth(
  url: string,
  init?: RequestInit,
): Promise<Response> {
  const headers = await buildAuthHeaders(init);
  const response = await fetch(url, { ...init, headers });

  // Retry once on 401 with a freshly fetched token, mirroring authMiddleware
  if (response.status === 401) {
    const freshToken = await globalAuthStore.getTokenFromAuth0Cache();
    if (freshToken) {
      const retryHeaders = await buildAuthHeaders(init, freshToken);
      return fetch(url, { ...init, headers: retryHeaders });
    }
  }

  return response;
}
