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
  Prisma,
  PrismaClient,
  StaffHousingApplication,
} from "~@idaho-th/prisma/client";

import {
  createHousingApplication,
  createProviderHousingApplication,
  createStaffHousingApplication,
} from "./housingApplication";
import {
  createHousingProvider,
  createHousingProviderLocation,
} from "./housingProvider";

type ApplicationOverrides =
  Partial<Prisma.HousingApplicationUncheckedCreateInput>;

type StaffApplicationOverrides = Omit<
  Partial<Prisma.StaffHousingApplicationUncheckedCreateInput>,
  "applicationId"
>;

type ProviderOverrides = Partial<Prisma.HousingProviderUncheckedCreateInput>;

type ProviderLocationOverrides = Omit<
  Partial<Prisma.HousingProviderLocationUncheckedCreateInput>,
  "providerId"
>;

type ProviderApplicationOverrides = Omit<
  Partial<Prisma.ProviderHousingApplicationUncheckedCreateInput>,
  "applicationId" | "providerId" | "providerLocationId"
>;

/** The provider half of the composition: a provider and the location it houses from. */
export type ProviderWithLocationSeed = {
  provider?: ProviderOverrides;
  location?: ProviderLocationOverrides;
};

export type ApplicationProviderSeed = ProviderWithLocationSeed & {
  providerApplication?: ProviderApplicationOverrides;
};

export type ApplicationWithProvidersOptions<
  TStaff extends StaffApplicationOverrides | null,
> = {
  application?: ApplicationOverrides;
  /** `null` seeds an application no case manager owns. */
  staffApplication?: TStaff;
  providers?: ApplicationProviderSeed[];
};

/**
 * Drops `undefined` values so an optional override never clobbers a factory
 * default. `null` is kept — it is how a seed asks for an explicitly empty column.
 */
function definedOverrides<T extends object>(overrides?: T): Partial<T> {
  if (!overrides) {
    return {};
  }
  return Object.fromEntries(
    Object.entries(overrides).filter(([, value]) => value !== undefined),
  ) as Partial<T>;
}

/** A provider with its own location, not attached to any application. */
export async function seedProviderWithLocation(
  prismaClient: PrismaClient,
  { provider: providerOverrides, location }: ProviderWithLocationSeed = {},
) {
  const provider = await createHousingProvider(
    prismaClient,
    definedOverrides(providerOverrides),
  );
  const providerLocation = await createHousingProviderLocation(prismaClient, {
    providerId: provider.id,
    ...definedOverrides(location),
  });

  return { provider, providerLocation };
}

/** A provider, its location, and the row attaching it to `applicationId`. */
export async function seedApplicationProvider(
  prismaClient: PrismaClient,
  applicationId: string,
  { providerApplication, ...providerSeed }: ApplicationProviderSeed = {},
) {
  const { provider, providerLocation } = await seedProviderWithLocation(
    prismaClient,
    providerSeed,
  );

  return {
    provider,
    providerLocation,
    providerApplication: await createProviderHousingApplication(prismaClient, {
      applicationId,
      providerId: provider.id,
      providerLocationId: providerLocation.id,
      ...definedOverrides(providerApplication),
    }),
  };
}

export type SeededApplicationProvider = Awaited<
  ReturnType<typeof seedApplicationProvider>
>;

/**
 * The composition every feature fixture is built on: an application, the staff
 * record that owns it, and one provider — with its own location and provider
 * application — per entry in `providers`, in the order they were asked for.
 *
 * Feature fixtures layer their own rows (info requests, home plans, timeline
 * events, ...) on top of what this returns rather than reimplementing it.
 */
export async function seedApplicationWithProviders<
  TStaff extends StaffApplicationOverrides | null = StaffApplicationOverrides,
>(
  prismaClient: PrismaClient,
  {
    application: applicationOverrides,
    staffApplication: staffApplicationOverrides,
    providers = [],
  }: ApplicationWithProvidersOptions<TStaff> = {},
): Promise<{
  application: Awaited<ReturnType<typeof createHousingApplication>>;
  staffApplication: TStaff extends null ? undefined : StaffHousingApplication;
  providers: SeededApplicationProvider[];
}> {
  const application = await createHousingApplication(
    prismaClient,
    definedOverrides(applicationOverrides),
  );

  const staffApplication =
    staffApplicationOverrides === null
      ? undefined
      : await createStaffHousingApplication(prismaClient, {
          applicationId: application.id,
          ...definedOverrides(staffApplicationOverrides ?? undefined),
        });

  const seededProviders = await Promise.all(
    providers.map((seed) =>
      seedApplicationProvider(prismaClient, application.id, seed),
    ),
  );

  return {
    application,
    // The staff record's presence is decided by the caller's `staffApplication`
    // option, which the conditional return type mirrors.
    staffApplication: staffApplication as TStaff extends null
      ? undefined
      : StaffHousingApplication,
    providers: seededProviders,
  };
}
