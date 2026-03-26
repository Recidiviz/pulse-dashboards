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

import { Permission } from "~@jii/auth";

import { ReadOnlyStaffPermissionError } from "../errors";
import type { AuthorizedResidentUserContext } from "../procedures/firebaseAuthedResidentProcedure";
import { isStaffUserOfResidentApp } from "../procedures/utils/isStaffUserOfResidentApp";

/**
 * Middleware that enforces resident-level permissions.
 *
 * Allows access if:
 * - The requesting user's pseudonymizedId matches the input pseudonymizedId, OR
 * - For queries: user has "enhanced" permission
 * - For mutations: user has "global_write" permission
 *
 * @throws {TRPCError} FORBIDDEN if user lacks permission
 *
 * Usage:
 * restrictedProcedureForState("US_XX")
 *   .input(z.object({ pseudonymizedId: z.string(), ... }))
 *   .use(residentRestrictedMiddleware)
 *   .query(...)
 *
 * @remarks
 * This middleware expects to be used on procedures that extend firebaseAuthedResidentProcedure
 * (such as those created by restrictedProcedureForState) so that ctx contains AuthorizedUserContext.
 * The input must include a pseudonymizedId field. Both of these constraints are type-enforced.
 */
export function residentRestrictedMiddleware<MiddlewareResult>({
  ctx,
  next,
  type,
  input,
}: {
  ctx: AuthorizedResidentUserContext;
  type: "mutation" | "query" | "subscription";
  input: { pseudonymizedId: string };
  next: (n: { ctx: AuthorizedResidentUserContext }) => MiddlewareResult;
}) {
  const isOwnData = ctx.userProfile.pseudonymizedId === input.pseudonymizedId;

  const specialPermission: Permission =
    type === "mutation" ? "global_write" : "enhanced";
  const hasSpecialPermission =
    ctx.userProfile.permissions?.includes(specialPermission);

  if (isOwnData || hasSpecialPermission) {
    return next({ ctx });
  }
  const message = `You do not have permission to ${type === "mutation" ? "update" : "access"} this resident's data`;

  // these errors are handled a little differently downstream of here
  // because staff user access may be read-only in prod; throwing a different error class
  // lets us identify these cases
  if (type === "mutation" && isStaffUserOfResidentApp(ctx)) {
    throw new ReadOnlyStaffPermissionError({ message });
  }
  // anything else is a normal error
  throw new TRPCError({
    code: "FORBIDDEN",
    message,
  });
}
