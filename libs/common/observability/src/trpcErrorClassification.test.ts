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
import { describe, expect, it } from "vitest";

import {
  classifyTrpcError,
  ERROR_KIND,
  markAsServerFault,
} from "~observability/trpcErrorClassification";

describe("classifyTrpcError", () => {
  it.each([
    ["BAD_REQUEST", ERROR_KIND.EXPECTED],
    ["UNAUTHORIZED", ERROR_KIND.EXPECTED],
    ["FORBIDDEN", ERROR_KIND.EXPECTED],
    ["NOT_FOUND", ERROR_KIND.EXPECTED],
    ["CONFLICT", ERROR_KIND.EXPECTED],
    ["UNPROCESSABLE_CONTENT", ERROR_KIND.EXPECTED],
    ["TOO_MANY_REQUESTS", ERROR_KIND.EXPECTED],
    ["CLIENT_CLOSED_REQUEST", ERROR_KIND.EXPECTED],
    ["INTERNAL_SERVER_ERROR", ERROR_KIND.UNEXPECTED],
    ["NOT_IMPLEMENTED", ERROR_KIND.UNEXPECTED],
    ["BAD_GATEWAY", ERROR_KIND.UNEXPECTED],
    ["SERVICE_UNAVAILABLE", ERROR_KIND.UNEXPECTED],
    ["GATEWAY_TIMEOUT", ERROR_KIND.UNEXPECTED],
  ] as const)("%s -> %s", (code, expectedKind) => {
    expect(classifyTrpcError(new TRPCError({ code })).kind).toBe(expectedKind);
  });

  it("reports plain exceptions as unexpected", () => {
    expect(classifyTrpcError(new TypeError("boom")).kind).toBe(
      ERROR_KIND.UNEXPECTED,
    );
  });

  it("reports non-Error throwables as unexpected", () => {
    expect(classifyTrpcError("boom").kind).toBe(ERROR_KIND.UNEXPECTED);
    expect(classifyTrpcError(undefined).kind).toBe(ERROR_KIND.UNEXPECTED);
    expect(classifyTrpcError(null).kind).toBe(ERROR_KIND.UNEXPECTED);
  });

  it("classifies a structurally-equivalent TRPCError from a duplicated @trpc/server copy", () => {
    const foreignPackageError = {
      name: "TRPCError",
      code: "BAD_REQUEST",
      message: "x",
    };
    expect(classifyTrpcError(foreignPackageError).kind).toBe(
      ERROR_KIND.EXPECTED,
    );
  });

  it.each([
    "BAD_REQUEST",
    "TIMEOUT",
    "TOO_MANY_REQUESTS",
    "PRECONDITION_FAILED",
  ] as const)(
    "reports a server-fault-marked %s as unexpected but keeps its code and status",
    (code) => {
      const error = markAsServerFault(new TRPCError({ code }));
      const unmarked = classifyTrpcError(new TRPCError({ code }));

      expect(classifyTrpcError(error)).toEqual({
        ...unmarked,
        kind: ERROR_KIND.UNEXPECTED,
      });
    },
  );

  it("reads the marker structurally on a TRPCError from a duplicated @trpc/server copy", () => {
    const foreignPackageError = markAsServerFault({
      name: "TRPCError",
      code: "BAD_REQUEST",
      message: "x",
    });
    expect(classifyTrpcError(foreignPackageError).kind).toBe(
      ERROR_KIND.UNEXPECTED,
    );
  });

  it("keeps the marker out of serialized output", () => {
    const error = markAsServerFault(new TRPCError({ code: "BAD_REQUEST" }));
    expect(Object.keys(error)).not.toContain("reportAsServerFault");
    expect(JSON.stringify(error)).not.toContain("reportAsServerFault");
  });

  it("returns the mapped HTTP status and code alongside the classification", () => {
    const result = classifyTrpcError(new TRPCError({ code: "NOT_FOUND" }));
    expect(result).toEqual({
      kind: ERROR_KIND.EXPECTED,
      code: "NOT_FOUND",
      httpStatus: 404,
    });
  });
});
