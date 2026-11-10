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
  ApplicationStage,
  ApplicationStatus,
  ApplicationSubStage,
  PrismaClient,
} from "~@idaho-th/prisma/client";
import {
  seedApplicationWithProviders,
  TEST_STAFF_PSEUDONYMIZED_ID,
} from "~@idaho-th/trpc/test/factories";

// `name` is required: providers are sorted by it, so every test names them.
type ProviderSeed = {
  name: string;
  stage?: ApplicationStage;
  subStage?: ApplicationSubStage;
  status?: ApplicationStatus;
};

type StaffApplicationProvidersOptions = {
  staffPseudonymizedId?: string;
  providers?: ProviderSeed[];
};

/**
 * A staff application with one provider application per entry in `providers`,
 * each backed by its own provider and location. The returned array matches the
 * order the test asked for — never the order the service returns them in.
 */
export async function seedStaffApplicationProviders(
  prismaClient: PrismaClient,
  {
    staffPseudonymizedId = TEST_STAFF_PSEUDONYMIZED_ID,
    providers = [],
  }: StaffApplicationProvidersOptions = {},
) {
  const {
    application,
    staffApplication,
    providers: providerApplications,
  } = await seedApplicationWithProviders(prismaClient, {
    staffApplication: { staffPseudonymizedId },
    providers: providers.map(({ name, ...providerApplication }) => ({
      provider: { name },
      providerApplication,
    })),
  });

  return { application, staffApplication, providerApplications };
}
