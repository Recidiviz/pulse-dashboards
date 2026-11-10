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

import type { HousingProviderOption } from "../../interfaces/common";

/** "1 location" / "3 locations"; nothing when the count is missing or zero. */
export function formatLocationsCount(locationsCount?: number): string | null {
  if (!locationsCount) return null;
  return locationsCount === 1 ? "1 location" : `${locationsCount} locations`;
}

/** "District 1" / "District 1, District 3"; nothing when there are none. */
export function formatDistricts(
  districts: HousingProviderOption["districts"],
): string | null {
  return districts?.length ? districts.join(", ") : null;
}
