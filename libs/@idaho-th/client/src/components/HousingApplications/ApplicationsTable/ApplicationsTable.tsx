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

import {
  ColumnDef,
  flexRender,
  getCoreRowModel,
  OnChangeFn,
  SortingState,
  useReactTable,
} from "@tanstack/react-table";
import React, { useCallback, useEffect, useRef, useState } from "react";

import { PaginationProps } from "../../../hooks/usePagination";
import { HousingApplication } from "../../../interfaces/common";
import FilterIcon from "../../assets/Filter.svg?react";
import SortIcon from "../../assets/sort-icon.svg?react";
import { Spinner } from "../../common/LoadingSpinner";
import { Pagination } from "../../Pagination";
import { ApplicationsFilterDropdown } from "./ApplicationsFilterDropdown";
import {
  type ApplicationsTableFilters,
  hasActiveFilters,
  type StatusFilterOption,
} from "./applicationsTable.filters";
import * as Styled from "./ApplicationsTable.styles";
import { COLUMNS } from "./columns";

interface ApplicationsTableProps {
  applications: HousingApplication[];
  columns?: ColumnDef<HousingApplication>[];
  emptyState?: React.ReactNode;
  isLoading?: boolean;
  onClick?: (application: HousingApplication) => void;
  pagination: PaginationProps;
  sorting: SortingState;
  onSortingChange: OnChangeFn<SortingState>;
  filters: ApplicationsTableFilters;
  hasSearch?: boolean;
  onFiltersChange: (filters: ApplicationsTableFilters) => void;
  hideDraftStageFilter?: boolean;
  statusFilterOptions: readonly StatusFilterOption[];
  showHomePlanFilter?: boolean;
}

export const ApplicationsTable: React.FC<ApplicationsTableProps> = ({
  applications,
  columns = COLUMNS,
  emptyState,
  isLoading,
  onClick,
  pagination,
  sorting,
  onSortingChange,
  filters,
  hasSearch,
  onFiltersChange,
  hideDraftStageFilter,
  statusFilterOptions,
  showHomePlanFilter,
}) => {
  const [isFilterOpen, setIsFilterOpen] = useState(false);
  const filterAnchorRef = useRef<HTMLDivElement>(null);
  const handleFilterClose = useCallback(() => setIsFilterOpen(false), []);

  useEffect(() => {
    if (!isFilterOpen) return;

    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") setIsFilterOpen(false);
    };
    const onMouseDown = (e: MouseEvent) => {
      if (
        filterAnchorRef.current &&
        e.target instanceof Node &&
        !filterAnchorRef.current.contains(e.target)
      ) {
        setIsFilterOpen(false);
      }
    };

    document.addEventListener("keydown", onKeyDown);
    document.addEventListener("mousedown", onMouseDown);
    return () => {
      document.removeEventListener("keydown", onKeyDown);
      document.removeEventListener("mousedown", onMouseDown);
    };
  }, [isFilterOpen]);

  const table = useReactTable({
    data: applications,
    columns,
    state: { sorting },
    onSortingChange,
    manualSorting: true,
    sortDescFirst: false,
    enableSortingRemoval: false,
    getCoreRowModel: getCoreRowModel(),
    meta: { onClick },
  });

  if (
    !isLoading &&
    !hasActiveFilters(filters) &&
    !hasSearch &&
    applications.length === 0
  ) {
    return emptyState ?? null;
  }

  return (
    <Styled.TableSection>
      <Styled.TableControlsRow>
        <Styled.ClientCountText>
          Clients: {pagination.totalCount}
        </Styled.ClientCountText>
        <Styled.FilterDropdownAnchor ref={filterAnchorRef}>
          <Styled.FilterButton
            type="button"
            aria-expanded={isFilterOpen}
            aria-haspopup="dialog"
            onClick={() => setIsFilterOpen((open) => !open)}
          >
            <FilterIcon width={20} height={20} />
            <Styled.FilterButtonText>Filters</Styled.FilterButtonText>
          </Styled.FilterButton>
          {isFilterOpen && (
            <ApplicationsFilterDropdown
              filters={filters}
              onChange={onFiltersChange}
              onClose={handleFilterClose}
              hideDraftStage={hideDraftStageFilter}
              statusFilterOptions={statusFilterOptions}
              showHomePlanFilter={showHomePlanFilter}
            />
          )}
        </Styled.FilterDropdownAnchor>
      </Styled.TableControlsRow>
      <Styled.Container>
        {isLoading ? (
          <Styled.LoadingContainer>
            <Spinner />
            <Styled.LoadingText>Loading applications…</Styled.LoadingText>
          </Styled.LoadingContainer>
        ) : (
          <>
            <Styled.TableContent>
              <Styled.TableInsets>
                <Styled.Table>
                  <Styled.TableHeader>
                    {table.getHeaderGroups().map((headerGroup) => (
                      <tr key={headerGroup.id}>
                        {headerGroup.headers.map((header) => {
                          const align = header.column.columnDef.meta?.textAlign;
                          const width = header.column.columnDef.meta?.width;
                          return (
                            <Styled.HeaderCell
                              key={header.id}
                              $align={align}
                              $width={width}
                            >
                              <Styled.HeaderCellInner $align={align}>
                                <Styled.SortableHeader
                                  $sortable={header.column.getCanSort()}
                                  onClick={
                                    header.column.getCanSort()
                                      ? header.column.getToggleSortingHandler()
                                      : undefined
                                  }
                                >
                                  {flexRender(
                                    header.column.columnDef.header,
                                    header.getContext(),
                                  )}
                                  {header.column.getCanSort() && (
                                    <Styled.SortIconWrapper
                                      $sortDirection={header.column.getIsSorted()}
                                    >
                                      <SortIcon />
                                    </Styled.SortIconWrapper>
                                  )}
                                </Styled.SortableHeader>
                              </Styled.HeaderCellInner>
                            </Styled.HeaderCell>
                          );
                        })}
                      </tr>
                    ))}
                  </Styled.TableHeader>
                  <tbody>
                    {table.getRowModel().rows.length === 0 ? (
                      <tr>
                        <Styled.FilterEmptyCell colSpan={columns.length}>
                          {hasSearch
                            ? "No applications found matching your search."
                            : "No applications match the selected filters."}
                        </Styled.FilterEmptyCell>
                      </tr>
                    ) : (
                      table.getRowModel().rows.map((row, index) => (
                        <React.Fragment key={row.id}>
                          <Styled.Row
                            tabIndex={onClick ? 0 : undefined}
                            onClick={() =>
                              table.options.meta?.onClick?.(row.original)
                            }
                            onKeyDown={(event) => {
                              if (!onClick) return;

                              if (event.key === "Enter" || event.key === " ") {
                                event.preventDefault();
                                table.options.meta?.onClick?.(row.original);
                              }
                            }}
                          >
                            {row.getVisibleCells().map((cell) => (
                              <React.Fragment key={cell.id}>
                                {flexRender(
                                  cell.column.columnDef.cell,
                                  cell.getContext(),
                                )}
                              </React.Fragment>
                            ))}
                          </Styled.Row>
                          {index < table.getRowModel().rows.length - 1 && (
                            <tr>
                              <Styled.DividerCell colSpan={columns.length}>
                                <Styled.DividerLine />
                              </Styled.DividerCell>
                            </tr>
                          )}
                        </React.Fragment>
                      ))
                    )}
                  </tbody>
                </Styled.Table>
              </Styled.TableInsets>
            </Styled.TableContent>
            <Pagination {...pagination} />
          </>
        )}
      </Styled.Container>
    </Styled.TableSection>
  );
};
