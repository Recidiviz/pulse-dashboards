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

import type { Prisma, PrismaClient } from "~@idaho-th/prisma/client";

type AiExtractionMetricsInput = Pick<
  Prisma.AiExtractionMetricsUncheckedCreateInput,
  "applicationId"
> &
  Partial<Prisma.AiExtractionMetricsUncheckedCreateInput>;

/**
 * One row per application (applicationId is unique). `scannedAt` falls back to
 * the column default of now(), which lands inside the default trailing window —
 * a test covering the window boundary must pass an explicit `scannedAt`.
 */
export function createAiExtractionMetrics(
  prismaClient: PrismaClient,
  { applicationId, ...overrides }: AiExtractionMetricsInput,
) {
  return prismaClient.aiExtractionMetrics.create({
    data: {
      applicationId,
      ...overrides,
    },
  });
}
