// Recidiviz - a data platform for criminal justice reform
// Copyright (C) 2024 Recidiviz, Inc.
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
    getSortedRowModel,
    SortDirection,
    useReactTable,
} from "@tanstack/react-table";
import moment from "moment";
import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";

import { filterExcludedAttributes } from "../../geoConfigs/utils";
import { psiUrl, sarUrl } from "../../utils/routing";
import SortIcon from "../assets/sort-icon.svg?react";
import {
    ACTIVE_STATUS,
    ARCHIVED_STATUS,
    CANCELLED_STATUS,
    CLIENT_KEY,
    FULL_NAME_KEY,
} from "./constants";
import * as Styled from "./Dashboard.styles";
import { useDetectOutsideClick } from "./hooks";
import {
    AttributeKey,
    CaseListTableCase,
    CaseListTableCases,
    CaseStatusToDisplay,
    RecommendationStatusFilter,
} from "./types";
import { isBeforeDueDateWithExtraDayOffset } from "./utils";

type CaseListTableProps = {
  caseTableData: CaseListTableCases;
  staffPseudoId: string;
  columns: ColumnDef<CaseListTableCase>[];
  excludedAttributeKeys: AttributeKey[];
  title: string;
  isSAR?: boolean;
  analytics: {
    trackIndividualCaseClicked: (
      clientName: string,
      recommendationStatus: CaseListTableCase["status"],
    ) => void;
    trackRecommendationStatusFilterChanged: (
      filters: RecommendationStatusFilter[],
    ) => void;
    trackDashboardSortOrderChanged: (
      sortDirection: false | SortDirection,
      columnName?: string,
    ) => void;
  };
};

type StatusFilter = RecommendationStatusFilter | typeof ACTIVE_STATUS;


const getUpdatedStatusFilters = (
  status: StatusFilter,
  currentFilters: StatusFilter[],
): StatusFilter[] => {
  if (status === ACTIVE_STATUS) {
    const includesArchived = currentFilters.includes(ARCHIVED_STATUS);
    const includesCancelled = currentFilters.includes(CANCELLED_STATUS);
    const archivedFilter: StatusFilter[] = includesArchived
      ? [ARCHIVED_STATUS]
      : [];
    const cancelledFilter: StatusFilter[] = includesCancelled
      ? [CANCELLED_STATUS]
      : [];
    const hasNoActiveStatusFilters = !Object.values(CaseStatusToDisplay).some(
      (status) => currentFilters.includes(status),
    );

    if (hasNoActiveStatusFilters) {
      return [...Object.values(CaseStatusToDisplay), ...currentFilters];
    }

    return currentFilters.length > 0
      ? [...archivedFilter, ...cancelledFilter]
      : Object.values(CaseStatusToDisplay);
  }

  return currentFilters.includes(status)
    ? currentFilters.filter((currStatus) => currStatus !== status)
    : [...currentFilters, status];
};

const LOCAL_STORAGE_KEY = "dashboard-sort-order";

export const CaseListTable = ({
  caseTableData,
  staffPseudoId,
  analytics,
  columns,
  excludedAttributeKeys,
  title,
  isSAR = false,
}: CaseListTableProps) => {
  const {
    trackIndividualCaseClicked,
    trackRecommendationStatusFilterChanged,
    trackDashboardSortOrderChanged,
  } = analytics;
  const navigate = useNavigate();
  const dropdownRef = useDetectOutsideClick(() => setShowFilterDropdown(false));

  const [data, setData] = useState(
    caseTableData.filter((dp) => isBeforeDueDateWithExtraDayOffset(dp.dueDate)), // Hide archived cases on initial load
  );
  const [showFilterDropdown, setShowFilterDropdown] = useState(false);
  const [statusFilters, setStatusFilters] = useState<StatusFilter[]>([
    ...Object.values(CaseStatusToDisplay),
  ]);

  const [sortingOrder, setSortingOrder] = useState(() => {
    const savedSortingOrder = localStorage.getItem(LOCAL_STORAGE_KEY);
    return savedSortingOrder
      ? JSON.parse(savedSortingOrder)
      : [{ id: "client_fullName", desc: false }];
  });

  const table = useReactTable({
    data,
    columns: columns.filter(
      filterExcludedAttributes(excludedAttributeKeys, "accessorKey"),
    ),
    state: {
      sorting: sortingOrder,
    },
    getSortedRowModel: getSortedRowModel(),
    getCoreRowModel: getCoreRowModel(),
    onSortingChange: setSortingOrder,
  });

  const filterOptions: { key: StatusFilter }[] = [
    { key: ACTIVE_STATUS },
    ...Object.values(CaseStatusToDisplay).map((status) => ({
      key: status,
    })),
    { key: ARCHIVED_STATUS },
    { key: CANCELLED_STATUS },
  ];

  const isFilterChecked = (status: StatusFilter) =>
    status === ACTIVE_STATUS
      ? statusFilters.length > 0 &&
        Object.values(CaseStatusToDisplay).some((filter) =>
          statusFilters.includes(filter),
        )
      : statusFilters.includes(status);

  const handleFilterChange = (status: StatusFilter) => {
    const filters = getUpdatedStatusFilters(status, statusFilters);
    const filtersExcludingActive = filters.filter(
      (item): item is RecommendationStatusFilter => item !== ACTIVE_STATUS,
    );

    trackRecommendationStatusFilterChanged(filtersExcludingActive);
    setStatusFilters(filters);
    setData(() => {
      return caseTableData
        .filter((datapoint) => {
          const includesArchived = filters.includes(ARCHIVED_STATUS);
          const includesCancelled = filters.includes(CANCELLED_STATUS);
          const hasMatchingStatus = filters.includes(
            CaseStatusToDisplay[datapoint.status],
          );

          // isCancelled only exists on PSI Cases (StaffCase), not SARs (StaffSAR)
          if ("isCancelled" in datapoint && datapoint.isCancelled) {
            // Include the case if it is cancelled and the CANCELLED_STATUS filter is active
            return includesCancelled;
          }
          if (!isBeforeDueDateWithExtraDayOffset(datapoint.dueDate)) {
            // Include the case if it is archived and the ARCHIVED_STATUS filter is active
            return includesArchived;
          }
          // Include the case if it matches the selected status filters
          return hasMatchingStatus;
        })
        .sort((a, b) => {
          // Moves archived cases to the bottom of the list
          const dueDateA = moment.utc(a.dueDate);
          const dueDateB = moment.utc(b.dueDate);
          return !a.dueDate || dueDateA.isBefore(dueDateB) ? 1 : -1;
        });
    });
  };

  // Preserve sorting order in user's local storage
  useEffect(() => {
    const savedSortingOrder = localStorage.getItem(LOCAL_STORAGE_KEY);
    if (
      sortingOrder?.length > 0 &&
      JSON.stringify(savedSortingOrder) !== JSON.stringify(sortingOrder)
    ) {
      localStorage.setItem(LOCAL_STORAGE_KEY, JSON.stringify(sortingOrder));
    }
  }, [sortingOrder]);

  return (
    <Styled.CaseListContainer>
      <Styled.Header>
        <Styled.TitleWrapper>
          <Styled.TableTitle>{title}</Styled.TableTitle>
        </Styled.TitleWrapper>
        <Styled.DropdownContainer ref={dropdownRef}>
          <Styled.DropdownTitle>Status</Styled.DropdownTitle>
          <Styled.DropdownButton
            onClick={() => setShowFilterDropdown((prev) => !prev)}
            isOpen={showFilterDropdown}
          >
            Status {statusFilters.length > 0 && `(${statusFilters.length})`}
          </Styled.DropdownButton>
          {showFilterDropdown && (
            <Styled.Dropdown>
              {filterOptions.map(({ key }) => (
                <Styled.DropdownOption
                  key={key}
                  isNested={
                    ![
                      ACTIVE_STATUS,
                      ARCHIVED_STATUS,
                      CANCELLED_STATUS,
                    ].includes(key)
                  }
                >
                  <input
                    id={`${key}-checkbox-status-filter-option`}
                    type="checkbox"
                    checked={isFilterChecked(key)}
                    onChange={() => handleFilterChange(key)}
                  />
                  <label htmlFor={`${key}-checkbox-status-filter-option`}>
                    {key}
                  </label>
                </Styled.DropdownOption>
              ))}
            </Styled.Dropdown>
          )}
        </Styled.DropdownContainer>
      </Styled.Header>

      <Styled.Table>
        <Styled.TableHeader>
          {table.getHeaderGroups().map((headerGroup) => (
            <Styled.Row key={headerGroup.id}>
              {headerGroup.headers.map((header) => (
                <Styled.HeaderCell key={header.id} colSpan={header.colSpan}>
                  <Styled.SortableHeader
                    sortable={header.column.getCanSort()}
                    onClick={header.column.getToggleSortingHandler()}
                  >
                    {flexRender(
                      header.column.columnDef.header,
                      header.getContext(),
                    )}
                    {header.column.getCanSort() && (
                      <Styled.SortIconWrapper
                        onClick={() =>
                          trackDashboardSortOrderChanged(
                            header.column.getIsSorted(),
                            String(header.column.columnDef.header),
                          )
                        }
                        sortDirection={header.column.getIsSorted()}
                      >
                        <SortIcon />
                      </Styled.SortIconWrapper>
                    )}
                  </Styled.SortableHeader>
                </Styled.HeaderCell>
              ))}
            </Styled.Row>
          ))}
        </Styled.TableHeader>
        <Styled.TableBody>
          {table.getRowModel().rows.map((row) => (
            <Styled.Row key={row.id}>
              {row.getVisibleCells().map((cell) => (
                <Styled.Cell
                  key={cell.id}
                  isLink={cell.column.id === `${CLIENT_KEY}_${FULL_NAME_KEY}`}
                  onClick={() => {
                    if (
                      cell.getValue() === cell.row.original.client?.fullName
                    ) {
                      trackIndividualCaseClicked(
                        cell.row.original.id,
                        cell.row.original.status,
                      );

                      if (isSAR) {
                        navigate(
                          sarUrl("sarDetails", {
                            staffPseudoId,
                            sarId: cell.row.original.id,
                          }),
                        );
                      } else {
                        navigate(
                          psiUrl("caseDetails", {
                            staffPseudoId,
                            caseId: cell.row.original.id,
                          }),
                        );
                      }
                    }
                  }}
                >
                  {flexRender(cell.column.columnDef.cell, cell.getContext())}
                </Styled.Cell>
              ))}
            </Styled.Row>
          ))}
          {data.length === 0 && (
            <Styled.Row>
              <Styled.Cell>No cases to display</Styled.Cell>
            </Styled.Row>
          )}
        </Styled.TableBody>
      </Styled.Table>
    </Styled.CaseListContainer>
  );
};
