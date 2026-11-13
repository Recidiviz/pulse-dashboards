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

import { useEffect } from "react";

import { usePublicCalendarServices } from "../services";

/** The landing page's address. */
export const LANDING_HREF = "/";

/** The address of a month's page: "2026-11" is "/2026-11". */
export function monthHref(month: string): string {
  return `/${month}`;
}

/**
 * The history state the landing page leaves on the month page it replaces
 * itself with: the landing read's notPublishedYet, for that page's "isn't
 * published yet" line. A read that names the month always returns null
 * there, so the month page can't get the line from its own read.
 */
export interface LandedState {
  notPublishedYet: string | null;
}

/** The notPublishedYet a landed history state carries, else null. */
export function landedNotPublishedYet(state: unknown): string | null {
  if (typeof state !== "object" || state === null) return null;
  const { notPublishedYet } = state as Partial<LandedState>;
  return typeof notPublishedYet === "string" ? notPublishedYet : null;
}

/**
 * Sends one page count for each month the page shows, and none when a poll
 * re-renders the same month.
 */
export function usePageCount(month: string | null) {
  const { pageCounts } = usePublicCalendarServices();
  useEffect(() => {
    pageCounts.page(month);
  }, [pageCounts, month]);
}
