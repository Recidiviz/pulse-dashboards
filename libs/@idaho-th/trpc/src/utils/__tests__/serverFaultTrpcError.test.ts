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

import { serverFaultTrpcError } from "~@idaho-th/trpc/utils/serverFaultTrpcError";
import { classifyTrpcError, ERROR_KIND } from "~observability";

describe("serverFaultTrpcError", () => {
  it("builds a TRPCError with the given code, message and cause, classified as unexpected", () => {
    const cause = new Error("upstream down");

    const error = serverFaultTrpcError({
      code: "BAD_REQUEST",
      message: "Extraction failed",
      cause,
    });

    expect(error).toBeInstanceOf(TRPCError);
    expect(error.code).toBe("BAD_REQUEST");
    expect(error.message).toBe("Extraction failed");
    expect(error.cause).toBe(cause);
    expect(classifyTrpcError(error).kind).toBe(ERROR_KIND.UNEXPECTED);
  });
});
