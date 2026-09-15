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

import { PATHWAYS_PAGES, PATHWAYS_SECTIONS } from "~shared-pathways";

import { PublicPathwaysDashboardPage } from "./dashboards";

/**
 * Sections a dashboard lists before its chart exists, so the pill row is whole
 * while the metrics land one at a time. These pills are selectable like any
 * other; only the event type decides which are disabled.
 *
 * Remove a section here once its metric is wired up in MetricsStore.
 *
 * This is keyed by dashboard rather than by tenant because the two dashboards
 * share section ids — `countOverTime` belongs to both.
 */
export const PLACEHOLDER_SECTIONS_BY_PAGE: Record<
  PublicPathwaysDashboardPage,
  ReadonlySet<string>
> = {
  [PATHWAYS_PAGES.prison]: new Set(),
  [PATHWAYS_PAGES.admissionsAndReleases]: new Set([
    PATHWAYS_SECTIONS["countByCustodyStatus"],
    PATHWAYS_SECTIONS["countByAdmissionType"],
  ]),
};
