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

import { ApplicationStage, type PrismaClient } from "~@idaho-th/prisma/client";
import {
  createEligibleHousingProvider,
  seedApplicationWithProviders,
  seedProviderWithLocation,
  TEST_DATES,
  TEST_STAFF_PSEUDONYMIZED_ID,
} from "~@idaho-th/trpc/test/factories";

type MatchableProviderSeed = {
  name?: string;
  /** Omit the EligibleHousingProvider row — the provider was never matched. */
  eligible?: boolean;
};

type MatchableApplicationOptions = {
  staffPseudonymizedId?: string;
  stage?: ApplicationStage;
  providers?: MatchableProviderSeed[];
};

// Matched providers hang off EligibleHousingProvider, not a provider
// application, so these are seeded outside seedApplicationWithProviders.
async function seedMatchableProvider(
  prismaClient: PrismaClient,
  applicationId: string,
  { name = "Sunrise House", eligible = true }: MatchableProviderSeed,
) {
  const { provider, providerLocation } = await seedProviderWithLocation(
    prismaClient,
    { provider: { name } },
  );
  const eligibleProvider = eligible
    ? await createEligibleHousingProvider(prismaClient, {
        applicationId,
        providerId: provider.id,
        providerLocationId: providerLocation.id,
      })
    : undefined;

  return { provider, providerLocation, eligibleProvider };
}

/**
 * A staff-owned application that has not been sent yet, with one matched
 * (or deliberately unmatched) provider per entry in `providers`.
 */
export async function seedMatchableApplication(
  prismaClient: PrismaClient,
  {
    staffPseudonymizedId = TEST_STAFF_PSEUDONYMIZED_ID,
    stage = ApplicationStage.APPLICATION,
    providers = [],
  }: MatchableApplicationOptions = {},
) {
  const { application, staffApplication } = await seedApplicationWithProviders(
    prismaClient,
    {
      application: {
        sentToProvidersAt: null,
        // Deliberately stale so a test can prove the send bumped lastActivityAt.
        lastActivityAt: TEST_DATES.LAST_ACTIVITY,
      },
      staffApplication: { staffPseudonymizedId, stage },
    },
  );

  const seededProviders = await Promise.all(
    providers.map((seed) =>
      seedMatchableProvider(prismaClient, application.id, seed),
    ),
  );

  return { application, staffApplication, providers: seededProviders };
}
