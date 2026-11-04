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

const SEARCH_SESSION_STORAGE_KEY = "cre_search_session_id";

/**
 * A random id scoped to one browsing session. Used only to group this resident's
 * search-query events together. Deliberately independent of SegmentClient.sessionId,
 * which is also attached to every other CRE event that still carries the resident's
 * real pseudoId.
 */
function getOrCreateSearchSessionId(): string {
  try {
    const existing = sessionStorage.getItem(SEARCH_SESSION_STORAGE_KEY);
    if (existing) return existing;

    const fresh = uuidv4();
    sessionStorage.setItem(SEARCH_SESSION_STORAGE_KEY, fresh);
    return fresh;
  } catch {
    // sessionStorage can throw - fall back to an id that's still safe to use
    // (just won't survive a reload), rather than taking down search entirely.
    return uuidv4();
  }
}

/**
 * Logs CRE search queries through a server-side mutation, so they never carry
 * the resident's identity.
 */
export function useAnonymousCreAnalytics() {
  const { apiClient } = useRootStore();
  const [searchSessionId] = useState(getOrCreateSearchSessionId);

  return useMemo(
    () => ({
      trackSearchQueryAnonymously: (query: string, resultCount: number) => {
        apiClient.trpc.resident.resources.logSearchQueryAnonymously
          .mutate({ query, resultCount, searchSessionId })
          .catch((e) => captureException(e));
      },
    }),
    [apiClient, searchSessionId],
  );
}
