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

import { Prisma, PrismaClient as BasePrismaClient } from "./client/client";
import { PrismaClientKnownRequestError } from "./client/internal/prismaNamespace";

/**
 * Prisma's code for `ConnectionClosed`, surfaced to callers as
 * "Server has closed the connection." Indicates that we tried to execute a query
 * over a dead connection.
 */
const CONNECTION_CLOSED_CODE = "P1017";

/**
 * Every operation Prisma can run against a model, taken from the generated type map.
 * This is the same union the `$allModels.$allOperations` hook reports, so both the names
 * below and the comparison against them are checked — a typo won't compile.
 */
type ModelOperation =
  keyof Prisma.TypeMap["model"][keyof Prisma.TypeMap["model"]]["operations"];

/**
 * Operations we are willing to re-run. All reads: if the first attempt did somehow
 * reach the database, running it again changes nothing.
 *
 * Writes are excluded because the error code we target could be thrown either before or after
 * changes were committed; for safety we don't take the risk of applying writes twice.
 */
const RETRYABLE_OPERATIONS: ReadonlySet<ModelOperation> = new Set([
  "aggregate",
  "count",
  "findFirst",
  "findFirstOrThrow",
  "findMany",
  "findUnique",
  "findUniqueOrThrow",
  "groupBy",
] satisfies ModelOperation[]);

function isConnectionClosed(e: unknown): boolean {
  return (
    e instanceof PrismaClientKnownRequestError &&
    e.code === CONNECTION_CLOSED_CODE
  );
}

/**
 * Retries a read once when it fails due to its connection being closed.
 *
 * This can happen (usually rarely) due to transient infra issues, e.g. increased error rates
 * in the Cloud SQL Auth Proxy in Cloud Run, which we have seen in the past. Retrying should
 * initiate a new connection, which is likely to succeed under these conditions.
 */
export function retryOnConnectionClosed(client: BasePrismaClient) {
  return client.$extends({
    name: "retryOnConnectionClosed",
    query: {
      // this only includes model operations and deliberately excludes raw SQL queries,
      // since we can't easily classify them as safe to retry
      $allModels: {
        async $allOperations({ operation, args, query }) {
          try {
            return await query(args);
          } catch (e) {
            // we're only targeting one specific case: a connection-closed error
            // on a read operation that is safe to retry. if both conditions
            // are not met, just rethrow the error
            if (
              !RETRYABLE_OPERATIONS.has(operation) ||
              !isConnectionClosed(e)
            ) {
              throw e;
            }
            // if we've gotten here, retry the query, which we expect to happen
            // on a fresh connection. a second failure will throw no matter what.
            return await query(args);
          }
        },
      },
    },
  });
}
