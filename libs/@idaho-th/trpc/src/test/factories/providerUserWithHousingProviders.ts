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

import type { Prisma, PrismaClient } from "~@idaho-th/prisma/client";

import { createHousingProvider } from "./housingProvider";
import {
  createHousingProviderUser,
  createHousingProviderUserAssignment,
} from "./housingProviderUser";

type HousingProviderUserOverrides =
  Partial<Prisma.HousingProviderUserUncheckedCreateInput>;

type HousingProviderOverrides =
  Partial<Prisma.HousingProviderUncheckedCreateInput>;

export type ProviderUserWithHousingProvidersOptions = {
  user?: HousingProviderUserOverrides;
  /**
   * One entry per organization the person is assigned to, in the order they are
   * returned. Defaults to exactly one — the world providerCaller() with no
   * explicit organization resolves against.
   */
  housingProviders?: HousingProviderOverrides[];
};

/**
 * The default provider world: the person providerCaller() acts as, the
 * organizations they manage, and the assignments joining them.
 *
 * Called with no options it seeds one user and one organization, so the
 * middleware's single-assignment branch resolves and a provider route test
 * needs no header. Pass two entries in `organizations` for a person who manages
 * several and must name the one they are acting as.
 */
export async function seedProviderUserWithHousingProviders(
  prismaClient: PrismaClient,
  {
    user,
    housingProviders = [{}],
  }: ProviderUserWithHousingProvidersOptions = {},
) {
  const providerUser = await createHousingProviderUser(prismaClient, user);

  const providers = await Promise.all(
    housingProviders.map((overrides) =>
      createHousingProvider(prismaClient, overrides),
    ),
  );

  const assignments = await Promise.all(
    providers.map((provider) =>
      createHousingProviderUserAssignment(prismaClient, {
        providerUserId: providerUser.id,
        providerId: provider.id,
      }),
    ),
  );

  return { user: providerUser, housingProviders: providers, assignments };
}
