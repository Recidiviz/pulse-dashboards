import { Prisma } from "@prisma/client";

import { prismaClient } from "~sentencing-server/prisma";

const PRISMA_TABLES = Prisma.dmmf.datamodel.models
  .map((model) => model.name)
  .filter((table) => table);

export async function resetDb() {
  await prismaClient.$transaction(
    PRISMA_TABLES.map((table) =>
      prismaClient.$executeRawUnsafe(`TRUNCATE "${table}" CASCADE;`),
    ),
  );
}
