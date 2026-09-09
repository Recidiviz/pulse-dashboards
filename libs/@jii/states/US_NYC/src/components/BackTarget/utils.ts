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

import { ResourceExplorer, State } from "~@jii/paths";

/**
 * Validates a `backTarget` query-param value, rejecting anything that isn't
 * an internal path - used to prevent malformed/malicious URLs from being
 * used, both for navigating there and for forwarding it to further pages.
 */
export function sanitizeBackTarget(value: string | undefined): string | null {
  if (!value?.startsWith("/") || value.startsWith("//")) return null;
  return value;
}

type CurrentPageContext = {
  residentParams: ReturnType<typeof State.Resident.getTypedParams>;
  category: string;
  resourceId: number;
  categoryResultsPath: string;
};

/**
 * Resolves a Detail page's back target from its own `backTarget`/`visitedResourceIds`
 * search params, and builds links to other Detail pages (via "similar resources") that
 * carry both forward correctly.
 *
 * `backTarget` is carried through unchanged at every hop, since it's the same origin
 * (the filtered list) regardless of how many Detail pages were visited in between.
 * `visitedResourceIds` grows by one resourceId per hop and is popped one at a time so
 * Back retraces each Detail page instead of jumping straight to `backTarget`.
 */
export function resolveResourceDetailBackTarget(
  searchParams: URLSearchParams,
  currentPageContext: CurrentPageContext,
): {
  backPath: string;
  similarResourcePath: (nextResourceId: number) => string;
} {
  const { residentParams, category, resourceId, categoryResultsPath } =
    currentPageContext;
  const { backTarget, visitedResourceIds } =
    ResourceExplorer.CategoryResults.Detail.getTypedSearchParams(searchParams);

  // Decode the visited resource ID chain into numbers, dropping anything malformed
  const visitedIds = visitedResourceIds
    ? visitedResourceIds.split(",").map(Number).filter(Number.isInteger)
    : [];
  // The last page visited before this current one, if any - the next "Back" destination
  const previousResourceId = visitedIds.at(-1);

  let backPath: string;
  if (previousResourceId === undefined) {
    // Nothing to retrace (fresh entry or chain fully popped) - fall back to wherever
    // the current page declared as its logical parent
    backPath = sanitizeBackTarget(backTarget) ?? categoryResultsPath;
  } else {
    // Retrace to the previous resource detail page, carrying backTarget through untouched
    // and dropping the entry we just popped from the chain
    const remainingVisitedIds = visitedIds.slice(0, -1).join(",") || undefined;

    const params = {
      ...residentParams,
      category,
      resourceId: previousResourceId,
    };
    const detailSearchParams = {
      backTarget,
      visitedResourceIds: remainingVisitedIds,
    };
    backPath = State.Resident.ResourceExplorer.CategoryResults.Detail.buildPath(
      params,
      detailSearchParams,
    );
  }

  // Generates a link to another similar resource detail page, extending the visited id chain
  // with the current page's own resourceId so its Back button leads back to the current page
  const similarResourcePath = (nextResourceId: number) => {
    const params = { ...residentParams, category, resourceId: nextResourceId };
    const detailSearchParams = {
      backTarget,
      visitedResourceIds: [...visitedIds, resourceId].join(","),
    };
    return State.Resident.ResourceExplorer.CategoryResults.Detail.buildPath(
      params,
      detailSearchParams,
    );
  };

  return { backPath, similarResourcePath };
}
