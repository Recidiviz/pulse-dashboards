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
  useReactTable,
} from "@tanstack/react-table";
import moment from "moment";
import { useState } from "react";
import { useNavigate } from "react-router-dom";

import { CaseWithClient } from "../../api";
import { psiUrl } from "../../utils/routing";
import { sortFullNameByLastName } from "../../utils/sorting";
import SortIcon from "../assets/sort-icon.svg?react";
import {
  CLIENT_FULL_NAME_KEY,
  DUE_DATE_KEY,
  ID_KEY,
  PRIMARY_CHARGE_KEY,
  REPORT_TYPE_KEY,
  STATUS_KEY,
} from "./constants";
import * as Styled from "./Dashboard.styles";
import { useDetectOutsideClick } from "./hooks";
import { CaseStatus } from "./types";

type CaseListTableProps = {
  caseTableData: Partial<CaseWithClient>[];
  staffPseudoId: string;
};

type StatusFilter = CaseStatus | "Active" | "Archived";

const columns = [
  {
    header: "First Name",
    accessorKey: CLIENT_FULL_NAME_KEY,
    sortingFn: (
      rowA: Row<Partial<CaseWithClient>>,
      rowB: Row<Partial<CaseWithClient>>,
    ) =>
      sortFullNameByLastName(
        rowA.original.Client?.fullName,
        rowB.original.Client?.fullName,
      ),
  },

  {
    header: "ID",
    accessorKey: ID_KEY,
    enableSorting: false,
  },
  {
    header: "Due Date",
    accessorKey: DUE_DATE_KEY,
    cell: (dueDate: CellContext<Partial<CaseWithClient>, Date>) =>
      moment(dueDate.getValue()).format("MM/DD/YYYY"),
  },
  {
    header: "Report Type",
    accessorKey: REPORT_TYPE_KEY,
  },
  {
    header: "Offense",
    accessorKey: PRIMARY_CHARGE_KEY,
    cell: (
      primaryCharge: CellContext<
        Partial<CaseWithClient>,
        CaseWithClient["primaryCharge"]
      >,
    ) => {
      const displayValue = primaryCharge.getValue() ?? "None Yet";
      return (
        <Styled.PrimaryCharge isNotSpecified={displayValue === "None Yet"}>
          {displayValue}
        </Styled.PrimaryCharge>
      );
    },
  },
  {
    header: "Recommendation Status",
    accessorKey: STATUS_KEY,
    cell: (
      status: CellContext<Partial<CaseWithClient>, keyof typeof CaseStatus>,
    ) => {
      const statusValue = status.getValue();
      const statusToDisplay =
        moment() < moment(status.cell.row.original.dueDate)
          ? CaseStatus[statusValue]
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
      return [...Object.values(CaseStatus), "Archived"];
    }
    return currentFilters.length > 0
      ? emptyOrArchived
      : Object.values(CaseStatus);
  }

  if (currentFilters.includes(status)) {
    return currentFilters.filter((currStatus) => currStatus !== status);
  }

  return [...currentFilters, status];
};

export const CaseListTable = ({
  caseTableData,
  staffPseudoId,
}: CaseListTableProps) => {
  const navigate = useNavigate();
  const dropdownRef = useDetectOutsideClick(() => setShowFilterDropdown(false));

  const [data, setData] = useState<Partial<CaseWithClient>[]>(caseTableData);
  const [showFilterDropdown, setShowFilterDropdown] = useState(false);
  const [statusFilters, setStatusFilters] = useState<StatusFilter[]>([
    ...Object.values(CaseStatus),
    "Archived",
  ]);

  const table = useReactTable({
    data,
    columns,
    getSortedRowModel: getSortedRowModel(),
    getCoreRowModel: getCoreRowModel(),
  });

  const filterOptions: { key: StatusFilter }[] = [
    { key: "Active" },
    ...Object.values(CaseStatus).map((status) => ({
      key: status,
    })),
    { key: "Archived" },
  ];

  const isFilterChecked = (status: StatusFilter) =>
    status === "Active"
      ? statusFilters.length > 0 &&
        Object.values(CaseStatus).some((filter) =>
          statusFilters.includes(filter),
        )
      : statusFilters.includes(status);

  const handleFilterChange = (status: StatusFilter) => {
    const filters = getUpdatedStatusFilters(status, statusFilters);
    setStatusFilters(filters);
    setData(() => {
      return caseTableData.filter((datapoint) => {
        const includesArchived = filters.includes("Archived");
        const isBeforeDueDate = moment() < moment(datapoint.dueDate);

        if (datapoint.status) {
          const hasMatchingStatus = filters.includes(
            CaseStatus[datapoint.status],
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
                  onClick={() =>
                    cell.getValue() === cell.row.original.Client?.fullName &&
                    navigate(
                      psiUrl("caseDetails", {
                        staffPseudoId,
                        caseId: cell.row.original.id,
                      }),
                    )
                  }
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
