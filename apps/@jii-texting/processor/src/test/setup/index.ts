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

import { Prisma, PrismaClient, StateCode } from "@prisma/jii-texting/client";
import { afterEach, beforeEach, vi } from "vitest";

import { getPrismaClientForStateCode } from "~@jii-texting/prisma";
import { seed } from "~@jii-texting/processor/test/setup/seed";
import { EARLIEST_LSU_MESSAGE_SEND_UTC_HOURS } from "~@jii-texting/utils";

export const testPrismaClient = getPrismaClientForStateCode(StateCode.US_ID);

const PRISMA_TABLES = Prisma.dmmf.datamodel.models
  .map((model) => model.name)
  .filter((table) => table);

async function resetDb(prismaClient: PrismaClient) {
  await prismaClient.$transaction(
    PRISMA_TABLES.map((table) =>
      prismaClient.$executeRawUnsafe(`TRUNCATE "${table}" CASCADE;`),
    ),
  );
}

beforeEach(async () => {
  await resetDb(testPrismaClient);
  await seed(testPrismaClient);
  vi.useFakeTimers();

  // Set the system to be later than the earliest time we want to send messages
  vi.setSystemTime(
    new Date(
      Date.UTC(2025, 3, 1, EARLIEST_LSU_MESSAGE_SEND_UTC_HOURS + 1, 0, 0),
    ),
  );
});

afterEach(() => {
  vi.clearAllMocks();
  vi.restoreAllMocks();
  vi.useRealTimers();
});
