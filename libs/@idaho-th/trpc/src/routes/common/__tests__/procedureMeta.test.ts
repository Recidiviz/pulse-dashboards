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

import { testPrismaClient } from "~@idaho-th/trpc/test/setup";

import type { ProcedureMeta } from "../procedureMeta";
import { requireProcedureMeta } from "../procedureMeta";

function buildProcedureMeta(overrides: Partial<ProcedureMeta> = {}) {
  return {
    traceId: "trace-1",
    procedureName: "test.procedure",
    prisma: testPrismaClient,
    staffPseudonymizedId: "staff-1",
    ...overrides,
  } as ProcedureMeta;
}

/** Narrows the thrown value so the assertion reads `error.code`, not a message. */
function codeOfThrown(run: () => unknown): string {
  try {
    run();
  } catch (error) {
    expect(error).toBeInstanceOf(TRPCError);
    return (error as TRPCError).code;
  }
  throw new Error("expected requireProcedureMeta to throw");
}

describe("requireProcedureMeta", () => {
  test("returns only the requested keys", () => {
    const procedureMeta = buildProcedureMeta();

    expect(
      requireProcedureMeta(procedureMeta, { staffPseudonymizedId: true }),
    ).toEqual({ staffPseudonymizedId: "staff-1" });

    const resolvedPrisma = requireProcedureMeta(procedureMeta, {
      prisma: true,
    });
    expect(Object.keys(resolvedPrisma)).toEqual(["prisma"]);
    expect(resolvedPrisma.prisma).toBe(testPrismaClient);
  });

  test("returns both keys when both are requested and satisfied", () => {
    const resolved = requireProcedureMeta(buildProcedureMeta(), {
      prisma: true,
      staffPseudonymizedId: true,
    });

    expect(resolved.staffPseudonymizedId).toBe("staff-1");
    expect(resolved.prisma).toBe(testPrismaClient);
  });

  test("rejects a missing staffPseudonymizedId as UNAUTHORIZED", () => {
    for (const staffPseudonymizedId of ["", undefined]) {
      const procedureMeta = buildProcedureMeta({
        staffPseudonymizedId: staffPseudonymizedId as string,
      });

      expect(
        codeOfThrown(() =>
          requireProcedureMeta(procedureMeta, { staffPseudonymizedId: true }),
        ),
      ).toBe("UNAUTHORIZED");
    }
  });

  test("rejects a missing prisma as INTERNAL_SERVER_ERROR", () => {
    const procedureMeta = buildProcedureMeta({
      prisma: undefined as unknown as ProcedureMeta["prisma"],
    });

    expect(
      codeOfThrown(() => requireProcedureMeta(procedureMeta, { prisma: true })),
    ).toBe("INTERNAL_SERVER_ERROR");
  });

  test("requires nothing when no requirements are given", () => {
    const emptyMeta = buildProcedureMeta({
      prisma: undefined as unknown as ProcedureMeta["prisma"],
      staffPseudonymizedId: "",
    });

    expect(requireProcedureMeta(emptyMeta, {})).toEqual({});
  });
});
