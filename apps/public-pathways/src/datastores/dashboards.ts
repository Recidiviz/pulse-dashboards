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

import { PATHWAYS_PAGES } from "~shared-pathways";

/**
 * The dashboards this app serves, in the order the dashboard switcher lists
 * them. `PATHWAYS_PAGES` also holds the pages that only the staff app shows,
 * so a page must be named here to be reachable from this app.
 */
export const PUBLIC_PATHWAYS_DASHBOARD_PAGES = [
  PATHWAYS_PAGES.prison,
  PATHWAYS_PAGES.admissionsAndReleases,
] as const;

export type PublicPathwaysDashboardPage =
  (typeof PUBLIC_PATHWAYS_DASHBOARD_PAGES)[number];

/**
 * How often each dashboard's data is refreshed. The switcher shows this next to
 * the dashboard name, because the two dashboards are on different schedules.
 */
export const DASHBOARD_CADENCE_LABELS: Record<
  PublicPathwaysDashboardPage,
  string
> = {
  [PATHWAYS_PAGES.prison]: "Monthly",
  [PATHWAYS_PAGES.admissionsAndReleases]: "Annual",
};

/** Returns true if this app serves a dashboard for the given page id. */
export function isPublicPathwaysDashboardPage(
  pageId: string,
): pageId is PublicPathwaysDashboardPage {
  return (PUBLIC_PATHWAYS_DASHBOARD_PAGES as readonly string[]).includes(
    pageId,
  );
}
