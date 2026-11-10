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

import { trpcMiddleware } from "@sentry/node";
import { initTRPC, TRPCError } from "@trpc/server";
import superjson from "superjson";

import { USER_ROLE } from "~@idaho-th/trpc/auth/constants";
import {
  deriveActiveProviderId,
  findProviderUserIdByPseudonymizedId,
  housingProviderAccessDeniedError,
  housingProviderRequiredError,
  isAssignedProvider,
} from "~@idaho-th/trpc/auth/resolveActiveHousingProvider";
import { createContext } from "~@idaho-th/trpc/context";
import {
  formatErrorForLog,
  scrubErrorText,
} from "~@idaho-th/trpc/utils/errorText";
import { classifyTrpcError, ERROR_KIND } from "~observability";

export const t = initTRPC.context<typeof createContext>().create({
  transformer: superjson,
  isDev: false,
  errorFormatter({ shape, error }) {
    if (error.code !== "INTERNAL_SERVER_ERROR") {
      return shape;
    }
    const safeData: Record<string, unknown> = { ...shape.data };
    delete safeData["stack"];
    return { ...shape, message: "Internal server error", data: safeData };
  },
});

export const router = t.router;
export const mergeRouters = t.mergeRouters;

const unexpectedErrorLogger = t.middleware(async (opts) => {
  const { path, type, ctx, next } = opts;
  // next() resolves to a MiddlewareResult ({ ok } | { ok: false, error })
  // rather than rejecting — a downstream throw only becomes a real
  // rejection back at the top-level procedure caller. try/catch around
  // next() never observes it; the result must be checked directly, same as
  // Sentry's own trpcMiddleware does.
  const result = await next();
  if (!result.ok) {
    // classifyTrpcError is also what the Sentry beforeSend filter
    // (apps/@idaho-th/server/src/sentry/index.ts) uses on the same error, so
    // "logged as unexpected" and "reported to Sentry" always agree.
    const { kind, code, httpStatus } = classifyTrpcError(result.error);
    if (kind === ERROR_KIND.UNEXPECTED) {
      ctx.req.log.error(
        { ...formatErrorForLog(result.error), trpcCode: code },
        "Unhandled tRPC procedure error",
      );
    } else {
      // Suppressed from Sentry on purpose — this log line is the audit trail
      // for expected client-facing outcomes (bad input, wrong role, not
      // found, etc.).
      ctx.req.log.warn(
        {
          trpcPath: path,
          trpcType: type,
          trpcCode: code,
          httpStatus,
          message: scrubErrorText(result.error.message),
        },
        "Expected tRPC error",
      );
    }
  }
  return result;
});

// Captures exceptions without attaching RPC input (housing forms, PDF base64,
// emails). unexpectedErrorLogger runs inside it so handler errors are logged
// to req.log before Sentry's own middleware (and ultimately the procedure
// caller) sees the same MiddlewareResult; expected TRPCErrors (auth,
// NOT_FOUND, etc.) are logged at warn level only, and are filtered out of
// Sentry by beforeSend (apps/@idaho-th/server/src/sentry/index.ts).
const instrumentedProcedure = t.procedure
  .use(
    trpcMiddleware({
      attachRpcInput: false,
    }),
  )
  .use(unexpectedErrorLogger);

/** Unauthenticated procedures (e.g. pre-login email checks). */
export const publicProcedure = instrumentedProcedure;

export const baseProcedure = instrumentedProcedure.use(async (opts) => {
  const { ctx } = opts;
  if (!ctx.isAuthorized) {
    throw new TRPCError({ code: "UNAUTHORIZED" });
  }
  return opts.next();
});

export const staffProcedure = baseProcedure.use(async (opts) => {
  const { ctx } = opts;

  if (ctx.role !== USER_ROLE.STAFF) {
    throw new TRPCError({
      code: "FORBIDDEN",
      message: "Staff access required",
    });
  }

  if (!ctx.staffPseudonymizedId) {
    throw new TRPCError({
      code: "UNAUTHORIZED",
      message: "Staff pseudonymized ID not found",
    });
  }

  return opts.next({
    ctx: { staffPseudonymizedId: ctx.staffPseudonymizedId },
  });
});

/**
 * A signed-in provider *person*, with no organization resolved.
 *
 * Only the endpoints that list and choose organizations build on this — every
 * other provider route needs a verified organization and uses
 * `providerProcedure`. Having no assignments is a valid state here: it is
 * what the selection screen's empty state is drawn from.
 */
export const providerProcedureBase = baseProcedure.use(async (opts) => {
  const { ctx } = opts;

  if (ctx.role !== USER_ROLE.PROVIDER) {
    throw new TRPCError({
      code: "FORBIDDEN",
      message: "Provider access required",
    });
  }

  if (!ctx.providerPseudonymizedId) {
    throw new TRPCError({
      code: "UNAUTHORIZED",
      message: "Provider pseudonymized ID not found",
    });
  }

  const providerUserId = await findProviderUserIdByPseudonymizedId(
    ctx.prisma,
    ctx.providerPseudonymizedId,
  );

  return opts.next({
    ctx: {
      providerPseudonymizedId: ctx.providerPseudonymizedId,
      providerUserId,
    },
  });
});

/**
 * The provider chokepoint: every provider-scoped route runs through here, so no
 * route can forget to check the organization it was asked to act as.
 *
 * `ctx.providerId` is a *verified* `HousingProvider` id — the request's claim
 * checked against the caller's assignments. Routes never see the raw request.
 */
export const providerProcedure = providerProcedureBase.use(async (opts) => {
  const { ctx } = opts;

  const { prisma, providerUserId, requestedProviderId } = ctx;

  let providerId: string | null | undefined = requestedProviderId;

  //fallback if the providerId is not provided in the request
  if (!providerId) {
    const assignments = await prisma.housingProviderUserAssignment.findMany({
      where: { providerUserId },
      select: { provider: { select: { id: true } } },
    });
    providerId = await deriveActiveProviderId(
      prisma,
      providerUserId,
      assignments,
    );
  }

  if (!providerId) throw housingProviderRequiredError();

  const isAssigned = await isAssignedProvider(
    prisma,
    providerUserId,
    providerId,
  );

  if (!isAssigned) throw housingProviderAccessDeniedError();

  return opts.next({ ctx: { providerId } });
});
