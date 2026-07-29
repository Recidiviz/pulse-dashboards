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

import { getPrismaClient } from "~@jii/prisma";

import { residentHandler } from "../handlers/resident/resident";
import { transformAndLoadRNAWritebackData } from "../handlers/usNcRNA/usNcRNA";
import { residentFixtures } from "./fixtures/resident";
import { usNcRNAWritebackFixtures } from "./fixtures/usNcRNA";

async function* toAsyncGenerator<T>(items: T[]) {
  for (const item of items) {
    yield item;
  }
}

await Promise.all(
  residentFixtures.entries().map(async ([stateCode, fixtures]) => {
    const prismaClient = getPrismaClient({ stateCode, demo: false });
    console.log(`Seeding fixtures for ${stateCode}`);
    try {
      await residentHandler(prismaClient, toAsyncGenerator(fixtures));

      if (stateCode === "US_NC") {
        await transformAndLoadRNAWritebackData(
          prismaClient,
          toAsyncGenerator(usNcRNAWritebackFixtures),
        );
      }
    } catch (e) {
      console.error(`Seeding failed for ${stateCode}`);
      throw e;
    }
  }),
);

console.log("Seeding complete");
// ensure the script doesn't hang once all the work is done
process.exit(0);
