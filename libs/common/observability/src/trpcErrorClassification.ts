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

import type { TRPCError } from "@trpc/server";
import { getHTTPStatusCodeFromError } from "@trpc/server/http";

/** The two outcomes a tRPC procedure error can be classified as. */
export const ERROR_KIND = {
  /** Client-facing outcome (bad input, wrong role, not found, etc.) — log only, never reported to Sentry. */
  EXPECTED: "expected",
  /** Server's fault (5xx, a `markAsServerFault` error, or a throwable that isn't even a TRPCError) — logged and reported to Sentry. */
  UNEXPECTED: "unexpected",
} as const;

export type ErrorKind = (typeof ERROR_KIND)[keyof typeof ERROR_KIND];

/**
 * `TRPCError.name`, used for the structural check in `asTrpcError` — kept as
 * a named constant so the string only appears once.
 */
const TRPC_ERROR_NAME = "TRPCError" as const;

/** HTTP status any non-`TRPCError` throwable is treated as. */
const UNKNOWN_ERROR_HTTP_STATUS = 500 as const;

// A plain string key, not a class or symbol, so it survives the duplicated
// @trpc/server copies `asTrpcError` is written for.
const SERVER_FAULT_MARKER = "reportAsServerFault" as const;

/**
 * Makes `classifyTrpcError` report a TRPCError as unexpected even though its
 * code maps below 500, so Sentry keeps it.
 */
export function markAsServerFault<T extends object>(error: T): T {
  Object.defineProperty(error, SERVER_FAULT_MARKER, {
    value: true,
    enumerable: false,
  });
  return error;
}

function isMarkedServerFault(err: object): boolean {
  return (err as Record<string, unknown>)[SERVER_FAULT_MARKER] === true;
}

export type TrpcErrorClassification = {
  kind: ErrorKind;
  code: TRPCError["code"] | undefined;
  httpStatus: number;
};

/**
 * Structural check instead of `instanceof TRPCError`: an Nx/pnpm monorepo can
 * legitimately resolve more than one copy of @trpc/server across apps, which
 * breaks constructor identity and would make `instanceof` fail open (silently
 * stop filtering, with no visible symptom other than Sentry noise coming back).
 */
export function asTrpcError(err: unknown): TRPCError | undefined {
  if (typeof err !== "object" || err === null) return undefined;

  const candidate = err as { name?: unknown; code?: unknown };
  const hasTrpcErrorShape: boolean =
    candidate.name === TRPC_ERROR_NAME && typeof candidate.code === "string";

  return hasTrpcErrorShape ? (err as TRPCError) : undefined;
}

/**
 * Single source of truth for "is this the server's fault" across logging and
 * Sentry reporting. The boundary is the HTTP status tRPC itself maps the code
 * to (>= 500 is unexpected), not a hand-maintained code allowlist — that way
 * BAD_GATEWAY/SERVICE_UNAVAILABLE/GATEWAY_TIMEOUT (real upstream failures)
 * keep being reported rather than being dropped by a naive
 * `code === "INTERNAL_SERVER_ERROR"` check. Errors flagged with
 * `markAsServerFault` are unexpected whatever their status.
 */
export function classifyTrpcError(err: unknown): TrpcErrorClassification {
  const trpcError = asTrpcError(err);

  if (!trpcError) {
    return {
      kind: ERROR_KIND.UNEXPECTED,
      code: undefined,
      httpStatus: UNKNOWN_ERROR_HTTP_STATUS,
    };
  }

  const httpStatus = getHTTPStatusCodeFromError(trpcError);

  return {
    kind:
      httpStatus >= UNKNOWN_ERROR_HTTP_STATUS || isMarkedServerFault(trpcError)
        ? ERROR_KIND.UNEXPECTED
        : ERROR_KIND.EXPECTED,
    code: trpcError.code,
    httpStatus,
  };
}
