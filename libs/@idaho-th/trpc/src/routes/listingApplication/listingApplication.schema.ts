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

import { searchSchema } from "~@idaho-th/shared/types";
import { applicationFiltersSchema } from "~@idaho-th/trpc/utils/filters";
import { paginationSchema } from "~@idaho-th/trpc/utils/pagination";
import { sortingSchema } from "~@idaho-th/trpc/utils/sorting";

/** Shared list input for staff and provider dashboard listings. */
export const listApplicationsBaseSchema = z.object({
  pagination: paginationSchema,
  sorting: sortingSchema,
  search: searchSchema,
  filters: applicationFiltersSchema,
});

export const getByStaffSchema = listApplicationsBaseSchema;

// The provider list shares the same input contract (pagination, sorting,
// search, filters). Provider scope comes from ctx — never from input.
export const getProviderApplicationsSchema = listApplicationsBaseSchema;
