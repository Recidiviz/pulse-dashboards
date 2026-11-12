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

import { TRPCError } from "@trpc/server";

import { Prisma } from "~@modules/Calendar/prisma";

/**
 * Whether e is a Prisma error with the given code, such as "P2002" for a
 * unique constraint violation or "P2025" for a guarded update that matched no
 * row.
 */
export function isPrismaErrorCode(
  e: unknown,
  code: string,
): e is Prisma.PrismaClientKnownRequestError {
  return e instanceof Prisma.PrismaClientKnownRequestError && e.code === code;
}

/**
 * The columns of the unique key a P2002 error names, without Postgres's
 * identifier quotes. The Modules client runs Prisma's query compiler over the
 * pg driver adapter, which reports the columns in
 * meta.driverAdapterError.cause.constraint.fields; Prisma's Rust engine
 * reports them in meta.target. Undefined when the error names no columns.
 */
function uniqueViolationColumns(
  e: Prisma.PrismaClientKnownRequestError,
): string[] | undefined {
  const meta = e.meta as
    | {
        target?: unknown;
        driverAdapterError?: {
          cause?: { constraint?: { fields?: unknown } };
        };
      }
    | undefined;
  const columns =
    meta?.driverAdapterError?.cause?.constraint?.fields ?? meta?.target;
  if (!Array.isArray(columns)) return undefined;
  return columns.map((column) => String(column).replace(/^"(.*)"$/, "$1"));
}

/**
 * Whether e is a P2002 unique violation on exactly these columns, in any
 * order. A P2002 on another key, or one that names no columns, doesn't match,
 * so callers rethrow it as a real error instead of misreporting it.
 */
export function isUniqueViolationOn(
  e: unknown,
  columns: readonly string[],
): boolean {
  if (!isPrismaErrorCode(e, "P2002")) return false;
  const violated = uniqueViolationColumns(e);
  return (
    violated !== undefined &&
    violated.length === columns.length &&
    columns.every((column) => violated.includes(column))
  );
}

/**
 * Turns the Prisma errors for a missing row into NOT_FOUND and rethrows
 * anything else. P2025 is an update or delete of a row that doesn't exist, and
 * P2003 is an insert whose parent row doesn't exist.
 */
export function handlePrismaError(e: unknown, notFoundMessage: string): never {
  if (
    e instanceof Prisma.PrismaClientKnownRequestError &&
    (e.code === "P2025" || e.code === "P2003")
  ) {
    throw new TRPCError({
      code: "NOT_FOUND",
      message: notFoundMessage,
      cause: e,
    });
  }
  throw e;
}
