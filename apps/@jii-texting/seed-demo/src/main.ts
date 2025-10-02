// Recidiviz - a data platform for criminal justice reform
// Copyright (C) 2024 Recidiviz, Inc.
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

import { getPrismaClientForStateCode } from "~@jii-texting/prisma/utils";
import { seedUsId } from "~@jii-texting/seed-demo/seedUsId";
import { seedUsTx } from "~@jii-texting/seed-demo/seedUsTx";

const usIdPrismaClient = getPrismaClientForStateCode(StateCode.US_ID);
const usTxPrismaClient = getPrismaClientForStateCode(StateCode.US_TX);

const PRISMA_TABLES = Prisma.dmmf.datamodel.models
  .map((model) => model.name)
  .filter((table) => table);

export async function resetDb(prismaClient: PrismaClient) {
  await prismaClient.$transaction(
    PRISMA_TABLES.map((table) =>
      prismaClient.$executeRawUnsafe(`TRUNCATE "${table}" CASCADE;`),
    ),
  );
}

async function main() {
  // Hydrate Idaho DB
  console.log("Hydrating Idaho DB...");
  await resetDb(usIdPrismaClient);
  await seedUsId(usIdPrismaClient);
  console.log("Done writing to Idaho DB");

  // Hydrate Texas DB
  console.log("Hydrating Texas DB...");
  await resetDb(usTxPrismaClient);
  await seedUsTx(usTxPrismaClient);
  console.log("Done writing to Texas DB");
}

main()
  .then(async () => {
    await usIdPrismaClient.$disconnect();
    await usTxPrismaClient.$disconnect();
  })
  .catch((e) => {
    console.error(e);
    process.exit(1);
  });
