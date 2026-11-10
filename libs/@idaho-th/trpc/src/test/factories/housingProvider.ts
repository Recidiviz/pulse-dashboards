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

import { uniqueId } from "./constants";

type HousingProviderInput = Partial<Prisma.HousingProviderUncheckedCreateInput>;

/**
 * The organization on its own, with nobody assigned to it — the people who
 * manage it are HousingProviderUser rows joined by an assignment.
 *
 * `name` is the organization's identity key and is unique, so it is suffixed
 * rather than fixed: a test that asserts on a name must pass its own.
 */
export function createHousingProvider(
  prismaClient: PrismaClient,
  overrides: HousingProviderInput = {},
) {
  return prismaClient.housingProvider.create({
    data: {
      name: uniqueId("Sunrise House"),
      ...overrides,
    },
  });
}

type HousingProviderLocationInput = Pick<
  Prisma.HousingProviderLocationUncheckedCreateInput,
  "providerId"
> &
  Partial<Prisma.HousingProviderLocationUncheckedCreateInput>;

export function createHousingProviderLocation(
  prismaClient: PrismaClient,
  { providerId, ...overrides }: HousingProviderLocationInput,
) {
  return prismaClient.housingProviderLocation.create({
    data: {
      providerId,
      district: "District 1",
      streetAddress: "123 Main St",
      city: "Boise",
      state: "ID",
      zip: "83702",
      acceptedGenders: ["ALL"],
      acceptsRiders: true,
      acceptsSexOffenders: false,
      acceptsViolentCriminals: false,
      faithBased: false,
      ...overrides,
    },
  });
}

/** One location per entry, so a test states the districts it cares about. */
export function createHousingProviderLocationsInDistricts(
  prismaClient: PrismaClient,
  providerId: string,
  districts: string[],
) {
  return Promise.all(
    districts.map((district) =>
      createHousingProviderLocation(prismaClient, { providerId, district }),
    ),
  );
}
