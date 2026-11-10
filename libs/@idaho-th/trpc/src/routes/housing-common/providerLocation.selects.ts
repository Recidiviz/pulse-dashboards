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

import type { Prisma } from "~@idaho-th/prisma/client";

// Keep in sync with ProviderLocationCore in ~@idaho-th/shared (minus id).
export const PROVIDER_LOCATION_CORE_SELECT = {
  district: true,
  acceptedGenders: true,
  acceptsRiders: true,
  acceptsSexOffenders: true,
  acceptsViolentCriminals: true,
  faithBased: true,
} as const satisfies Prisma.HousingProviderLocationSelect;

export const PROVIDER_LOCATION_DETAIL_SELECT = {
  id: true,
  streetAddress: true,
  city: true,
  state: true,
  zip: true,
  ...PROVIDER_LOCATION_CORE_SELECT,
} as const satisfies Prisma.HousingProviderLocationSelect;

export const PROVIDER_LOCATION_STAFF_SELECT = {
  id: true,
  ...PROVIDER_LOCATION_CORE_SELECT,
} as const satisfies Prisma.HousingProviderLocationSelect;
