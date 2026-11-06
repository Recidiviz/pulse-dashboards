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

import { handlePrismaError, isPrismaErrorCode } from "../src/errors";

function prismaError(code: string) {
  return new Prisma.PrismaClientKnownRequestError("Prisma failed", {
    code,
    clientVersion: "test",
  });
}

describe("handlePrismaError", () => {
  it.each(["P2025", "P2003"])("turns %s into NOT_FOUND", (code) => {
    expect(() =>
      handlePrismaError(prismaError(code), "Entry not found"),
    ).toThrow(
      expect.objectContaining({
        code: "NOT_FOUND",
        message: "Entry not found",
      }),
    );
  });

  it("rethrows any other Prisma error unchanged", () => {
    const error = prismaError("P2002");

    expect(() => handlePrismaError(error, "Entry not found")).toThrow(error);
  });

  it("rethrows an error that isn't Prisma's", () => {
    const error = new TRPCError({ code: "FORBIDDEN" });

    expect(() => handlePrismaError(error, "Entry not found")).toThrow(error);
  });
});

describe("isPrismaErrorCode", () => {
  it.each(["P2002", "P2025"])("matches a Prisma %s error", (code) => {
    expect(isPrismaErrorCode(prismaError(code), code)).toBe(true);
  });

  it("doesn't match a Prisma error with another code", () => {
    expect(isPrismaErrorCode(prismaError("P2025"), "P2002")).toBe(false);
  });

  it("doesn't match an error that isn't Prisma's, even with a code field", () => {
    const error = Object.assign(new Error("P2002"), { code: "P2002" });

    expect(isPrismaErrorCode(error, "P2002")).toBe(false);
  });
});
