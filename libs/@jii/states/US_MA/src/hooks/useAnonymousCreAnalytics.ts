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

import { captureException } from "@sentry/react";
import { useMemo, useState } from "react";
import { v4 as uuidv4 } from "uuid";

import { useRootStore } from "~@jii/data";

const ANONYMOUS_SESSION_STORAGE_KEY = "cre_anonymous_session_id";

/**
 * A random id scoped to one browsing session, similar to `getOrCreateSearchSessionId`
 * in libs/@jii/states/US_NYC/src/hooks/useCreAnalytics.ts
 */
function getOrCreateAnonymousSessionId(): string {
  try {
    const existing = sessionStorage.getItem(ANONYMOUS_SESSION_STORAGE_KEY);
    if (existing) return existing;

    const fresh = uuidv4();
    sessionStorage.setItem(ANONYMOUS_SESSION_STORAGE_KEY, fresh);
    return fresh;
  } catch {
    return uuidv4();
  }
}

/**
 * Logs CRE search queries through a server-side mutation, so they never carry
 * the resident's identity.
 */
export function useAnonymousCreAnalytics() {
  const { apiClient } = useRootStore();
  const [anonymousSessionId] = useState(getOrCreateAnonymousSessionId);

  return useMemo(
    () => ({
      trackSearchQueryAnonymously: (query: string, resultCount: number) => {
        apiClient.trpc.resident.resources.logSearchQueryAnonymously
          .mutate({ query, resultCount, searchSessionId: anonymousSessionId })
          .catch((e) => captureException(e));
      },
    }),
    [apiClient, anonymousSessionId],
  );
}
