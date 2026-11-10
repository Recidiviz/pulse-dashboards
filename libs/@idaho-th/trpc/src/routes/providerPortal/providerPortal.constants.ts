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

/**
 * What a provider sees when the organization name they chose is already held by
 * another organization. `HousingProvider.name` is unique, so without this the
 * caller would be shown a raw database constraint violation instead of
 * something they can act on.
 */
export const HOUSING_PROVIDER_NAME_TAKEN_MESSAGE =
  "That provider name is already in use. Please choose a different name." as const;
