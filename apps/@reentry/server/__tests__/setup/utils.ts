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

import { PostgresSaver } from "@langchain/langgraph-checkpoint-postgres";
import { Client } from "pg";

import { Prisma, PrismaClient } from "~@reentry/prisma/client";

const PRISMA_TABLES = Object.values(Prisma.ModelName);

export async function resetDbs(
  prismaClient: PrismaClient,
  checkpointer: PostgresSaver,
) {
  await prismaClient.$transaction(
    PRISMA_TABLES.map((table) =>
      prismaClient.$executeRawUnsafe(`TRUNCATE "${table}" CASCADE;`),
    ),
  );

  // PostgreSQL connection configuration
  const client = new Client({
    connectionString:
      process.env["INTAKE_LANGGRAPH_CHECKPOINTER_CONNECTION_STRING"],
  });

  // Reset the Postgres checkpointer database
  try {
    await client.connect();
    await client.query(
      `DROP SCHEMA IF EXISTS ${process.env["INTAKE_LANGGRAPH_CHECKPOINTER_SCHEMA"]} CASCADE`,
    );
  } catch (err) {
    console.error("Error dropping schema:", err);
  } finally {
    await client.end();
  }

  await checkpointer.setup();
}
