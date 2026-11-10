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
import type { HOUSING_PROVIDER_SELECT } from "~@idaho-th/trpc/routes/housingProvider/housingProvider.selects";

export type HousingProviderRecord = Prisma.HousingProviderGetPayload<{
  select: typeof HOUSING_PROVIDER_SELECT;
}>;

/** One row in the selection screen. */
export type HousingProvider = {
  id: string;
  name: string;
  locationsCount: number;
  /** Distinct district names across the organization's locations, A to Z. */
  districts: string[];
};

export type ResolvedHousingProviders = {
  /** Every organization the caller is assigned to; empty is a valid answer. */
  housingProviders: HousingProvider[];
  /**
   * The organization the caller acts as without choosing one, or `null` when
   * the client must show the selection screen. Never an error: a provider with
   * nothing resolved still has a picker to render.
   */
  activeProviderId: string | null;
};
