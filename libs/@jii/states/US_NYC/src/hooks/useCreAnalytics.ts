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
import { useTypedParams } from "react-router-typesafe-routes/dom";
import { v4 as uuidv4 } from "uuid";

import { useRootStore } from "~@jii/data";
import { State } from "~@jii/paths";

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

export function useCreAnalytics() {
  const {
    apiClient,
    userStore: { segmentClient },
  } = useRootStore();
  const { personPseudoId } = useTypedParams(State.Resident);
  const [searchSessionId] = useState(getOrCreateSearchSessionId);

  return useMemo(
    () => ({
      trackCategorySelected: (category: string) =>
        segmentClient.trackCreCategorySelected({
          justiceInvolvedPersonPseudoId: personPseudoId,
          category,
        }),

      trackSubcategorySelected: (
        category: string,
        subcategory: string,
        isOpen: boolean,
      ) =>
        segmentClient.trackCreSubcategorySelected({
          justiceInvolvedPersonPseudoId: personPseudoId,
          category,
          subcategory,
          isOpen,
        }),

      trackFiltersUpdated: (
        category: string,
        subcategories: string[],
        tags: string[],
      ) =>
        segmentClient.trackCreFiltersUpdated({
          justiceInvolvedPersonPseudoId: personPseudoId,
          category,
          subcategories,
          tags,
        }),

      trackFilterCleared: (category: string) =>
        segmentClient.trackCreFilterCleared({
          justiceInvolvedPersonPseudoId: personPseudoId,
          category,
        }),

      trackResourceViewed: (
        resourceId: number,
        resourceName: string,
        source: Parameters<
          typeof segmentClient.trackCreResourceViewed
        >[0]["source"],
      ) =>
        segmentClient.trackCreResourceViewed({
          justiceInvolvedPersonPseudoId: personPseudoId,
          resourceId,
          resourceName,
          source,
        }),

      trackDescriptionToggled: (
        resourceId: number,
        resourceName: string,
        isExpanded: boolean,
      ) =>
        segmentClient.trackCreDescriptionToggled({
          justiceInvolvedPersonPseudoId: personPseudoId,
          resourceId,
          resourceName,
          isExpanded,
        }),

      // Logged server-side instead of via Segment directly, so this event never
      // carries the resident's identity
      trackSearchQueryAnonymously: (query: string, resultCount: number) => {
        apiClient.trpc.resident.resources.logSearchQueryAnonymously
          .mutate({ query, resultCount, searchSessionId })
          .catch((e) => captureException(e));
      },
    }),
    [segmentClient, personPseudoId, apiClient, searchSessionId],
  );
}
