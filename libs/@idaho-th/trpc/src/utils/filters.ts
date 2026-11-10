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
  APPLICATION_FILTER_RELEASE_DATE,
  LAST_UPDATED_FILTER_VALUES,
  RELEASE_DATE_DAY_LIMITS,
} from "~@idaho-th/shared";

const housingApplicationFiltersSchema = z.object({
  stage: z.array(z.string()).optional(),
  status: z.array(z.string()).optional(),
  releaseDate: z.array(z.string()).optional(),
  lastUpdated: z.array(z.enum(LAST_UPDATED_FILTER_VALUES)).optional(),
  homePlan: z.boolean().optional(),
});

export const applicationFiltersSchema =
  housingApplicationFiltersSchema.optional();

export type ApplicationFilters = z.infer<
  typeof housingApplicationFiltersSchema
>;

function buildReleaseDateWhere(selected?: string[]): {
  expectedReleaseDate?: { gte: Date; lt: Date };
} {
  if (
    !selected?.length ||
    selected.includes(APPLICATION_FILTER_RELEASE_DATE.ALL_TIME)
  ) {
    return {};
  }

  const maxDays = Math.max(
    ...selected.map((option) => RELEASE_DATE_DAY_LIMITS[option] ?? 0),
  );
  if (maxDays <= 0) return {};

  const start = new Date();
  start.setHours(0, 0, 0, 0);

  const end = new Date(start);
  end.setDate(end.getDate() + maxDays + 1);

  return { expectedReleaseDate: { gte: start, lt: end } };
}

export type WorkflowFiltersArg = {
  /** Record-local (`self`) filters: merged into the primary `where`. */
  recordWhere: Record<string, unknown>;
  /** Application-level filters: nested under the `application` relation. */
  applicationWhere: Record<string, unknown>;
};

export function buildFiltersArg(
  filters?: ApplicationFilters,
): WorkflowFiltersArg {
  if (!filters) return { recordWhere: {}, applicationWhere: {} };

  const recordWhere: Record<string, unknown> = {
    ...(filters.stage?.length ? { stage: { in: filters.stage } } : {}),
    ...(filters.status?.length ? { status: { in: filters.status } } : {}),
  };

  const applicationWhere: Record<string, unknown> = {
    ...buildReleaseDateWhere(filters.releaseDate),
  };

  return { recordWhere, applicationWhere };
}
