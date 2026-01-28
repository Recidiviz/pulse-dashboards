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

import { TRPCError } from "@trpc/server";

import { Prisma } from "~@sentencing/prisma/client";

/**
 * Handles common Prisma errors and converts them to TRPCErrors.
 *
 * @param e - The error to handle
 * @param notFoundMessage - Message to use for P2025 (record not found) and P2003 (foreign key constraint) errors
 * @throws TRPCError with NOT_FOUND code for P2025/P2003, or rethrows the original error
 */
export function handlePrismaError(e: unknown, notFoundMessage: string): never {
  if (e instanceof Prisma.PrismaClientKnownRequestError) {
    // P2025: Record not found (update/delete on non-existent record)
    // P2003: Foreign key constraint failed (create with non-existent parent)
    if (e.code === "P2025" || e.code === "P2003") {
      throw new TRPCError({
        code: "NOT_FOUND",
        message: notFoundMessage,
        cause: e,
      });
    }
  }
  throw e;
}
