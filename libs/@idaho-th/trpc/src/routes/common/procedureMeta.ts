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

import type { PrismaClient } from "~@idaho-th/prisma/client";

export type ProcedureMeta = {
  traceId: string;
  procedureName: string;
  prisma: PrismaClient;
  staffPseudonymizedId: string;
};

export type ProcedureMetaForLog = Omit<ProcedureMeta, "prisma">;

export type ProcedureMetaRequirements = {
  prisma?: true;
  staffPseudonymizedId?: true;
};

type ResolvedProcedureMeta<T extends ProcedureMetaRequirements> = {
  [K in keyof T as T[K] extends true
    ? K extends "prisma" | "staffPseudonymizedId"
      ? K
      : never
    : never]: K extends "prisma"
    ? PrismaClient
    : K extends "staffPseudonymizedId"
      ? string
      : never;
};

export function requireProcedureMeta<const T extends ProcedureMetaRequirements>(
  procedureMeta: ProcedureMeta,
  required: T,
): ResolvedProcedureMeta<T> {
  const resolved = {} as ResolvedProcedureMeta<T>;

  if (required.staffPseudonymizedId) {
    const staffPseudonymizedId = procedureMeta.staffPseudonymizedId;
    if (!staffPseudonymizedId) {
      throw new TRPCError({
        code: "UNAUTHORIZED",
        message: "Missing staffPseudonymizedId in request context",
      });
    }
    Object.assign(resolved, { staffPseudonymizedId });
  }

  if (required.prisma) {
    const prisma = procedureMeta.prisma;
    if (!prisma) {
      throw new TRPCError({
        code: "INTERNAL_SERVER_ERROR",
        message: "Missing prisma in request context",
      });
    }
    Object.assign(resolved, { prisma });
  }

  return resolved;
}
