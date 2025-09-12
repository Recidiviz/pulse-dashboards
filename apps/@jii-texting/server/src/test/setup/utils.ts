// Recidiviz - a data platform for criminal justice reform
// Copyright (C) 2025 Recidiviz, Inc.
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

import { expect, vi } from "vitest";

import { Prisma, PrismaClient } from "~@jii-texting/prisma/client";
import { testkit } from "~@jii-texting/server/test/setup";

const PRISMA_TABLES = Object.values(Prisma.ModelName);

export async function resetDb(prismaClient: PrismaClient) {
  await prismaClient.$transaction(
    PRISMA_TABLES.map((table) =>
      prismaClient.$executeRawUnsafe(`TRUNCATE "${table}" CASCADE;`),
    ),
  );
}

export async function testAndGetSentryReports(expectedLength = 1) {
  // Use waitFor because sentry-testkit can be async
  const sentryReports = await vi.waitFor(async () => {
    const reports = testkit.reports();
    expect(reports).toHaveLength(expectedLength);

    return reports;
  });

  return sentryReports;
}
