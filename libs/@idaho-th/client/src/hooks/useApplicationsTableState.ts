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

import { OnChangeFn, SortingState } from "@tanstack/react-table";
import { useCallback, useState } from "react";

import { USER_ROLE, type UserRole } from "~@idaho-th/shared";

import {
  type ApplicationsTableFilters,
  buildApplicationFilters,
  EMPTY_APPLICATIONS_TABLE_FILTERS,
} from "../components/HousingApplications/ApplicationsTable/applicationsTable.filters";
import { usePagination } from "./usePagination";

type SearchFilter = Record<string, { contains: string; mode: "insensitive" }>;

export const PAGE_SIZE = 8;

const DEFAULT_SORTING: Record<UserRole, SortingState> = {
  [USER_ROLE.STAFF]: [{ id: "expectedReleaseDate", desc: false }],
  [USER_ROLE.PROVIDER]: [{ id: "dateReceived", desc: true }],
};

const COLUMN_SORT_FIELDS: Record<string, string> = {
  alerts: "updatedAt",
};

function buildSearchFilter(text: string): SearchFilter | undefined {
  return text
    ? { clientName: { contains: text, mode: "insensitive" } }
    : undefined;
}

export interface ApplicationsTableQuery {
  pagination: { cursor: string | undefined; pageSize: number };
  sorting: { field: string; direction: "asc" | "desc" } | undefined;
  search: SearchFilter | undefined;
  filters: ReturnType<typeof buildApplicationFilters>;
}

export function useApplicationsTableState(role: UserRole) {
  const [sorting, setSorting] = useState<SortingState>(DEFAULT_SORTING[role]);
  const [filters, setFilters] = useState<ApplicationsTableFilters>(
    EMPTY_APPLICATIONS_TABLE_FILTERS,
  );
  const [searchQuery, setSearchQuery] = useState<SearchFilter | undefined>(
    undefined,
  );
  const pagination = usePagination();
  const { reset: resetPagination } = pagination;

  const handleSearchChange = useCallback(
    (value: string) => {
      setSearchQuery(buildSearchFilter(value));
      resetPagination();
    },
    [resetPagination],
  );

  const handleFiltersChange = useCallback(
    (newFilters: ApplicationsTableFilters) => {
      setFilters(newFilters);
      resetPagination();
    },
    [resetPagination],
  );

  const handleSortingChange: OnChangeFn<SortingState> = useCallback(
    (updater) => {
      setSorting(updater);
      resetPagination();
    },
    [resetPagination],
  );

  const activeSorting = sorting[0]
    ? {
        field: COLUMN_SORT_FIELDS[sorting[0].id] ?? sorting[0].id,
        direction: (sorting[0].desc ? "desc" : "asc") as "asc" | "desc",
      }
    : undefined;

  const query: ApplicationsTableQuery = {
    pagination: { cursor: pagination.cursor, pageSize: PAGE_SIZE },
    sorting: activeSorting,
    search: searchQuery,
    filters: buildApplicationFilters(filters, role),
  };

  return {
    sorting,
    filters,
    hasSearch: searchQuery !== undefined,
    pagination,
    query,
    handleSearchChange,
    handleFiltersChange,
    handleSortingChange,
  };
}
