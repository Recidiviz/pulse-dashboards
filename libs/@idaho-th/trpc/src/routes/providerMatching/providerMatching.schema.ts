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

import { Prisma } from "~@idaho-th/prisma/client";
import { eligibilityParamsSchema } from "~@idaho-th/shared";
import { searchSchema } from "~@idaho-th/shared/types";

export const resolvePreferredProvidersSchema = z.object({
  prefProviderNames: z.array(z.string().min(1)).min(1).max(20),
});

export const getProvidersSchema = z.object({
  search: searchSchema,
  distinct: z
    .array(z.nativeEnum(Prisma.HousingProviderScalarFieldEnum))
    .optional(),
});

export const getProvidersWithEligibilitySchema = z.object({
  search: searchSchema,
  eligibilityParams: eligibilityParamsSchema,
});

export const sendToProvidersSchema = z.object({
  applicationId: z.string(),
  providerIds: z.array(z.string()),
});
