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

import { z } from "zod";

import {
  ApplicationStage,
  ApplicationStatus,
  ApplicationSubStage,
  type Prisma,
} from "~@idaho-th/prisma/client";

export const providerApplicationFiltersShape = z.object({
  stage: z.array(z.nativeEnum(ApplicationStage)).optional(),
  subStage: z.array(z.nativeEnum(ApplicationSubStage)).optional(),
  status: z.array(z.nativeEnum(ApplicationStatus)).optional(),
});

export const providerApplicationFiltersSchema =
  providerApplicationFiltersShape.optional();

export function buildProviderApplicationWhere(
  filters?: z.infer<typeof providerApplicationFiltersShape>,
): Prisma.ProviderHousingApplicationWhereInput {
  if (!filters) return {};

  return {
    ...(filters.stage?.length ? { stage: { in: filters.stage } } : {}),
    ...(filters.subStage?.length ? { subStage: { in: filters.subStage } } : {}),
    ...(filters.status?.length ? { status: { in: filters.status } } : {}),
  };
}
