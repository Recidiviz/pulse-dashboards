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

// Maps tenant IDs to the set of section IDs that are coming soon. Sections in
// this set appear in the More dropdown as disabled pills. Remove a section ID
// here and wire up its metric in MetricsStore when the data is ready to ship.
export const COMING_SOON_SECTIONS_BY_TENANT: Partial<
  Record<string, Set<string>>
> = {
  US_NY: new Set([
    "countByReligion",
    "countByMaritalStatus",
    "countByTimeAtFacility",
  ]),
};
