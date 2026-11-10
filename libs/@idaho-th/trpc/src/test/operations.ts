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

import type { PrismaClient } from "~@idaho-th/prisma/client";

/**
 * The real client, wrapped so every operation it runs is recorded. Lets a test
 * assert query shape — a joined read, a single nested write, a row lock —
 * without mocking away the database. Model operations are recorded as
 * `Model.operation`; raw queries as the bare operation name (e.g. `$queryRaw`).
 */
export function createOperationRecordingClient(prismaClient: PrismaClient) {
  const operations: string[] = [];

  const client = prismaClient.$extends({
    query: {
      $allOperations({ model, operation, args, query }) {
        operations.push(model == null ? operation : `${model}.${operation}`);
        return query(args);
      },
    },
  }) as unknown as PrismaClient;

  return { client, operations };
}
