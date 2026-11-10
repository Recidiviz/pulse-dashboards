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

import type {
  ProviderDetailsRow,
  ProviderUserContactRow,
} from "./providerPortal.selects";

/**
 * The settings screen's single payload, assembled from the two tables the split
 * put its fields in: the organization the caller is acting as, and the caller.
 */
export function mapProviderDetailsFromRow(
  housingProvider: ProviderDetailsRow,
  user: ProviderUserContactRow,
) {
  return {
    housingProviderName: housingProvider.name,
    contactName: user.name,
    contactEmail: user.email,
    contactPhone: user.contactPhone,
    locations: housingProvider.locations,
  };
}
