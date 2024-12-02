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
  CellContext,
  flexRender,
  getCoreRowModel,
  getSortedRowModel,
  Row,
  SortDirection,
  useReactTable,
} from "@tanstack/react-table";
import moment from "moment";
import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";

import { psiUrl } from "../../utils/routing";
import { sortFullNameByLastNameDescending } from "../../utils/sorting";
import { displayReportType } from "../../utils/utils";
import SortIcon from "../assets/sort-icon.svg?react";
import { REPORT_TYPE_KEY } from "../CaseDetails/constants";
import {
  CLIENT_FULL_NAME_KEY,
  DUE_DATE_KEY,
  ID_KEY,
  OFFENSE_KEY,
  STATUS_KEY,
} from "./constants";
import * as Styled from "./Dashboard.styles";
import { useDetectOutsideClick } from "./hooks";
import {
  CaseListTableCase,
  CaseListTableCases,
  CaseStatusToDisplay,
  RecommendationStatusFilter,
  ReportType,
} from "./types";

type CaseListTableProps = {
  caseTableData: CaseListTableCases;
  staffPseudoId: string;
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

type StatusFilter = RecommendationStatusFilter | "Active";

const columns = [
  {
    header: "Name",
    accessorKey: CLIENT_FULL_NAME_KEY,
    sortingFn: (rowA: Row<CaseListTableCase>, rowB: Row<CaseListTableCase>) =>
      sortFullNameByLastNameDescending(
        rowA.original.client?.fullName,
        rowB.original.client?.fullName,
      ),
    cell: (name: CellContext<CaseListTableCase, string>) => {
      const clientName = name.getValue() ?? "No name found";
      return (
        <div style={{ textTransform: "capitalize" }}>
          {clientName.toLocaleLowerCase()}
        </div>
      );
    },
  },
  {
    header: "ID",
    accessorKey: ID_KEY,
    enableSorting: false,
  },
  {
    header: "Due Date",
    accessorKey: DUE_DATE_KEY,
    cell: (dueDate: CellContext<CaseListTableCase, Date>) =>
      moment(dueDate.getValue()).utc().format("MM/DD/YYYY"),
  },
  {
    header: "Report Type",
    accessorKey: REPORT_TYPE_KEY,
    cell: (
      reportType: CellContext<CaseListTableCase, keyof typeof ReportType>,
    ) => {
      const value = reportType.getValue();
      return displayReportType(value);
    },
  },
  {
    header: "Offense",
    accessorKey: OFFENSE_KEY,
    cell: (
      offense: CellContext<CaseListTableCase, CaseListTableCase["offense"]>,
    ) => {
      const displayValue = offense.getValue() ?? "None Yet";
      return (
        <Styled.Offense isNotSpecified={displayValue === "None Yet"}>
          {displayValue}
        </Styled.Offense>
      );
    },
  },
  {
    header: "Recommendation Status",
    accessorKey: STATUS_KEY,
    cell: (
      status: CellContext<CaseListTableCase, CaseListTableCase["status"]>,
    ) => {
      const statusValue = status.getValue();
      const statusToDisplay =
        moment().utc() < moment(status.cell.row.original.dueDate).utc()
          ? CaseStatusToDisplay[statusValue]
          : "Archived";

      return (
        <Styled.StatusChip status={statusToDisplay}>
          {statusToDisplay}
        </Styled.StatusChip>
      );
    },
  },
];

const getUpdatedStatusFilters = (
  status: StatusFilter,
  currentFilters: StatusFilter[],
): StatusFilter[] => {
  if (status === "Active") {
    const includesArchived = currentFilters.includes("Archived");
    const emptyOrArchived: StatusFilter[] = includesArchived
      ? ["Archived"]
      : [];

    if (includesArchived && currentFilters.length === 1) {
      return [...Object.values(CaseStatusToDisplay), "Archived"];
    }
    return currentFilters.length > 0
      ? emptyOrArchived
      : Object.values(CaseStatusToDisplay);
  }

  if (currentFilters.includes(status)) {
    return currentFilters.filter((currStatus) => currStatus !== status);
  }

  return [...currentFilters, status];
};

const LOCAL_STORAGE_KEY = "dashboard-sort-order";

export const CaseListTable = ({
  caseTableData,
  staffPseudoId,
  analytics,
}: CaseListTableProps) => {
  const {
    trackIndividualCaseClicked,
    trackRecommendationStatusFilterChanged,
    trackDashboardSortOrderChanged,
  } = analytics;
  const navigate = useNavigate();
  const dropdownRef = useDetectOutsideClick(() => setShowFilterDropdown(false));

  const [data, setData] = useState(
    caseTableData.filter((dp) => moment().utc() < moment(dp.dueDate).utc()), // Hide archived cases on initial load
  );
  const [showFilterDropdown, setShowFilterDropdown] = useState(false);
  const [statusFilters, setStatusFilters] = useState<StatusFilter[]>([
    ...Object.values(CaseStatusToDisplay),
  ]);

  const [sortingOrder, setSortingOrder] = useState(() => {
    const savedSortingOrder = localStorage.getItem(LOCAL_STORAGE_KEY);
    return savedSortingOrder ? JSON.parse(savedSortingOrder) : [];
  });

  const table = useReactTable({
    data,
    columns,
    state: {
      sorting: sortingOrder,
    },
    getSortedRowModel: getSortedRowModel(),
    getCoreRowModel: getCoreRowModel(),
    onSortingChange: setSortingOrder,
  });

  const filterOptions: { key: StatusFilter }[] = [
    { key: "Active" },
    ...Object.values(CaseStatusToDisplay).map((status) => ({
      key: status,
    })),
    { key: "Archived" },
  ];

  const isFilterChecked = (status: StatusFilter) =>
    status === "Active"
      ? statusFilters.length > 0 &&
        Object.values(CaseStatusToDisplay).some((filter) =>
          statusFilters.includes(filter),
        )
      : statusFilters.includes(status);

  const handleFilterChange = (status: StatusFilter) => {
    const filters = getUpdatedStatusFilters(status, statusFilters);
    const filtersExcludingActive = filters.filter(
      (item): item is RecommendationStatusFilter => item !== "Active",
    );
    trackRecommendationStatusFilterChanged(filtersExcludingActive);
    setStatusFilters(filters);
    setData(() => {
      return caseTableData.filter((datapoint) => {
        const includesArchived = filters.includes("Archived");
        const isBeforeDueDate =
          moment().utc() < moment(datapoint.dueDate).utc();

        if (datapoint.status) {
          const hasMatchingStatus = filters.includes(
            CaseStatusToDisplay[datapoint.status],
          );
          if (!includesArchived) {
            return hasMatchingStatus && isBeforeDueDate;
          }
          if (!hasMatchingStatus && !isBeforeDueDate) {
            return true;
          }
          return hasMatchingStatus;
        }
        return true;
      });
    });
  };

  // Preserve sorting order in user's local storage
  useEffect(() => {
    const savedSortingOrder = localStorage.getItem(LOCAL_STORAGE_KEY);
    if (
      sortingOrder.length > 0 &&
      JSON.stringify(savedSortingOrder) !== JSON.stringify(sortingOrder)
    ) {
      localStorage.setItem(LOCAL_STORAGE_KEY, JSON.stringify(sortingOrder));
    }
  }, [sortingOrder]);

  return (
    <Styled.CaseListContainer>
      <Styled.Header>
        <Styled.TitleWrapper>
          <Styled.TableTitle>My Cases</Styled.TableTitle>
        </Styled.TitleWrapper>
        <Styled.DropdownContainer ref={dropdownRef}>
          <Styled.DropdownTitle>Recommendation Status</Styled.DropdownTitle>
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
                  isNested={!["Active", "Archived"].includes(key)}
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
                  onClick={() => {
                    if (
                      cell.getValue() === cell.row.original.client?.fullName
                    ) {
                      trackIndividualCaseClicked(
                        cell.row.original.id,
                        cell.row.original.status,
                      );
                      navigate(
                        psiUrl("caseDetails", {
                          staffPseudoId,
                          caseId: cell.row.original.id,
                        }),
                      );
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
