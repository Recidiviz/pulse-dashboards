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

import type { AuthorizedUserProfile } from "~@jii/auth";
import type { PrismaClient } from "~@jii/prisma";

import type { AuthorizedResidentUserContext } from "../procedures/firebaseAuthedResidentProcedure";
import { residentRestrictedMiddleware } from "./residentRestrictedMiddleware";

describe("residentRestrictedMiddleware", () => {
  const mockNext = vi.fn();
  const mockPrisma = {} as PrismaClient;

  const createMockContext = (
    pseudonymizedId: string,
    permissions: AuthorizedUserProfile["permissions"] = [],
  ): AuthorizedResidentUserContext => ({
    userId: "user-123",
    stateCode: "US_XX",
    prisma: mockPrisma,
    userProfile: {
      pseudonymizedId,
      stateCode: "US_XX",
      permissions,
    },
  });

  beforeEach(() => {
    mockNext.mockClear();
    mockNext.mockResolvedValue({ ok: true, data: "success" });
  });

  describe("accessing own data", () => {
    it("allows user to access their own data in a query", async () => {
      const ctx = createMockContext("user-pseudo-id", []);
      const input = { pseudonymizedId: "user-pseudo-id" };

      await residentRestrictedMiddleware({
        ctx,
        next: mockNext,
        type: "query",
        input,
      });

      expect(mockNext).toHaveBeenCalledWith({ ctx });
    });

    it("allows user to access their own data in a mutation", async () => {
      const ctx = createMockContext("user-pseudo-id", []);
      const input = { pseudonymizedId: "user-pseudo-id" };

      await residentRestrictedMiddleware({
        ctx,
        next: mockNext,
        type: "mutation",
        input,
      });

      expect(mockNext).toHaveBeenCalledWith({ ctx });
    });
  });

  describe("accessing other users' data with enhanced permission", () => {
    it("allows queries with enhanced permission", async () => {
      const ctx = createMockContext("user-pseudo-id", ["enhanced"]);
      const input = { pseudonymizedId: "other-user-pseudo-id" };

      await residentRestrictedMiddleware({
        ctx,
        next: mockNext,
        type: "query",
        input,
      });

      expect(mockNext).toHaveBeenCalledWith({ ctx });
    });

    it("blocks mutations with only enhanced permission", () => {
      const ctx = createMockContext("user-pseudo-id", ["enhanced"]);
      const input = { pseudonymizedId: "other-user-pseudo-id" };

      expect(() =>
        residentRestrictedMiddleware({
          ctx,
          next: mockNext,
          type: "mutation",
          input,
        }),
      ).toThrow(
        new TRPCError({
          code: "FORBIDDEN",
          message: "You do not have permission to update this resident's data",
        }),
      );

      expect(mockNext).not.toHaveBeenCalled();
    });
  });

  describe("accessing other users' data with global_write permission", () => {
    it("allows mutations with global_write permission", async () => {
      const ctx = createMockContext("user-pseudo-id", ["global_write"]);
      const input = { pseudonymizedId: "other-user-pseudo-id" };

      await residentRestrictedMiddleware({
        ctx,
        next: mockNext,
        type: "mutation",
        input,
      });

      expect(mockNext).toHaveBeenCalledWith({ ctx });
    });

    it("blocks queries with only global_write permission (needs enhanced)", () => {
      const ctx = createMockContext("user-pseudo-id", ["global_write"]);
      const input = { pseudonymizedId: "other-user-pseudo-id" };

      expect(() =>
        residentRestrictedMiddleware({
          ctx,
          next: mockNext,
          type: "query",
          input,
        }),
      ).toThrow(
        new TRPCError({
          code: "FORBIDDEN",
          message: "You do not have permission to access this resident's data",
        }),
      );

      expect(mockNext).not.toHaveBeenCalled();
    });
  });

  describe("accessing other users' data without required permissions", () => {
    it("blocks queries without enhanced or global_write permission", () => {
      const ctx = createMockContext("user-pseudo-id", ["live_data"]);
      const input = { pseudonymizedId: "other-user-pseudo-id" };

      expect(() =>
        residentRestrictedMiddleware({
          ctx,
          next: mockNext,
          type: "query",
          input,
        }),
      ).toThrow(
        new TRPCError({
          code: "FORBIDDEN",
          message: "You do not have permission to access this resident's data",
        }),
      );

      expect(mockNext).not.toHaveBeenCalled();
    });

    it("blocks mutations without global_write permission", () => {
      const ctx = createMockContext("user-pseudo-id", ["live_data"]);
      const input = { pseudonymizedId: "other-user-pseudo-id" };

      expect(() =>
        residentRestrictedMiddleware({
          ctx,
          next: mockNext,
          type: "mutation",
          input,
        }),
      ).toThrow(
        new TRPCError({
          code: "FORBIDDEN",
          message: "You do not have permission to update this resident's data",
        }),
      );

      expect(mockNext).not.toHaveBeenCalled();
    });

    it("blocks queries when permissions array is undefined", () => {
      const ctx = createMockContext("user-pseudo-id", undefined);
      const input = { pseudonymizedId: "other-user-pseudo-id" };

      expect(() =>
        residentRestrictedMiddleware({
          ctx,
          next: mockNext,
          type: "query",
          input,
        }),
      ).toThrow(
        new TRPCError({
          code: "FORBIDDEN",
          message: "You do not have permission to access this resident's data",
        }),
      );

      expect(mockNext).not.toHaveBeenCalled();
    });

    it("blocks mutations when permissions array is undefined", () => {
      const ctx = createMockContext("user-pseudo-id", undefined);
      const input = { pseudonymizedId: "other-user-pseudo-id" };

      expect(() =>
        residentRestrictedMiddleware({
          ctx,
          next: mockNext,
          type: "mutation",
          input,
        }),
      ).toThrow(
        new TRPCError({
          code: "FORBIDDEN",
          message: "You do not have permission to update this resident's data",
        }),
      );

      expect(mockNext).not.toHaveBeenCalled();
    });
  });

  describe("with multiple permissions", () => {
    it("allows access with both enhanced and global_write permissions", async () => {
      const ctx = createMockContext("user-pseudo-id", [
        "live_data",
        "enhanced",
        "global_write",
      ]);
      const input = { pseudonymizedId: "other-user-pseudo-id" };

      await residentRestrictedMiddleware({
        ctx,
        next: mockNext,
        type: "query",
        input,
      });

      expect(mockNext).toHaveBeenCalledWith({ ctx });

      await residentRestrictedMiddleware({
        ctx,
        next: mockNext,
        type: "mutation",
        input,
      });

      expect(mockNext).toHaveBeenCalledWith({ ctx });
    });
  });
});
