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
import { PROVIDER_LOCATION_DETAIL_SELECT } from "~@idaho-th/trpc/routes/housing-common/providerLocation.selects";

export const PROVIDER_CORE_SELECT = {
  id: true,
  name: true,
} as const satisfies Prisma.HousingProviderSelect;

export type ProviderCoreRow = Prisma.HousingProviderGetPayload<{
  select: typeof PROVIDER_CORE_SELECT;
}>;

/** The organization's own settings. Its people are a separate table. */
export const PROVIDER_DETAILS_SELECT = {
  name: true,
  locations: {
    select: PROVIDER_LOCATION_DETAIL_SELECT,
    orderBy: [{ district: "asc" }, { streetAddress: "asc" }],
  },
} as const satisfies Prisma.HousingProviderSelect;

export type ProviderDetailsRow = Prisma.HousingProviderGetPayload<{
  select: typeof PROVIDER_DETAILS_SELECT;
}>;

/**
 * The caller's own contact details, which follow the person across every
 * organization they manage rather than belonging to any one of them.
 */
export const PROVIDER_USER_CONTACT_SELECT = {
  name: true,
  email: true,
  contactPhone: true,
} as const satisfies Prisma.HousingProviderUserSelect;

export type ProviderUserContactRow = Prisma.HousingProviderUserGetPayload<{
  select: typeof PROVIDER_USER_CONTACT_SELECT;
}>;
