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

import { describePatternRules } from "~@modules/Calendar/rules";
import type { CurrentPatternRow, ResourceDto } from "~@parole-board/common";

import type { FacilityPatternRow } from "./FacilityPatterns";

/**
 * Returns the Facility patterns rows for patterns.listCurrent's rows, in the
 * server's order. A location reads "[label] — [full name]", such as
 * "FCF — Fremont", with the full name from config.get's resources; it reads
 * the label alone when the calendar has no full name for it. A row with no
 * resource, such as Full Board, reads its kind's label. A slot with no
 * pattern gets null days, which the list shows as "No pattern".
 */
export function facilityPatternRows(
  patterns: readonly CurrentPatternRow[],
  resources: readonly ResourceDto[],
): FacilityPatternRow[] {
  const names = new Map(resources.map(({ id, name }) => [id, name]));
  return patterns.map(({ slotKey, kind, resource, pattern }) => {
    const name = resource ? names.get(resource.id) : null;
    let fullName = kind.label;
    if (resource) {
      fullName = name ? `${resource.label} — ${name}` : resource.label;
    }
    return {
      id: slotKey,
      fullName,
      days: pattern ? describePatternRules(pattern.rules) : null,
    };
  });
}

/** The number of locations among the rows, which leaves out meeting kinds. */
export function countLocations(patterns: readonly CurrentPatternRow[]): number {
  return patterns.filter(({ resource }) => resource !== null).length;
}
