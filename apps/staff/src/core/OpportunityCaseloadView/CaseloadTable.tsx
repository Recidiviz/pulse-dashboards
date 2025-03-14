// Recidiviz - a data platform for criminal justice reform
// Copyright (C) 2025 Recidiviz, Inc.
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

import { palette, spacing, typography } from "@recidiviz/design-system";
import {
  ColumnDef,
  flexRender,
  getCoreRowModel,
  getSortedRowModel,
  SortDirection,
  SortingState,
  useReactTable,
} from "@tanstack/react-table";
import { observer } from "mobx-react-lite";
import { rem } from "polished";
import { Dispatch, SetStateAction } from "react";
import styled from "styled-components/macro";

import SortIcon from "../../assets/static/images/sortIcon.svg?react";
import useIsMobile from "../../hooks/useIsMobile";
import { NavigateToFormButtonStyle } from "../../WorkflowsStore/Opportunity/Forms/NavigateToFormButton";
import { PersonIdWithCopyIcon } from "../PersonId/PersonId";

const Table = styled.table`
  width: 100%;
  ${typography.Sans14};
  text-align: left;
`;

const SortableHeader = styled.div<{ $sortable?: boolean }>`
  display: inline-flex;
  align-items: center;
  gap: ${rem(spacing.sm)};
  cursor: ${({ $sortable }) => ($sortable ? "pointer" : "default")};
`;

const TableHeader = styled.thead`
  width: 100%;
  background-color: ${palette.marble1};
`;

const SharedTableCellStyles = `
  height: 49px;
  padding-left: ${rem(spacing.xs)};
  padding-right: ${rem(spacing.xs)};
`;

const HeaderCell = styled.th`
  ${SharedTableCellStyles}
  color: ${palette.slate80};
  font-weight: unset;
  user-select: none;
`;

// TODO(#7572): Keep base table implementation generic
const Cell = styled.td<{ $expandedLastColumn: boolean; $isMobile: boolean }>`
  ${SharedTableCellStyles}

  color: ${palette.pine1};

  width: 13%;
  ${({ $isMobile }) => ($isMobile ? `min-width: 100px;` : `min-width: 125px;`)}

  ${({ $expandedLastColumn }) =>
    /* Offset last column to fill all available space and right-align contents */
    $expandedLastColumn &&
    `&:last-child {
    text-align: right;
    width: auto;
    padding-right: ${rem(spacing.xl)};
  }`}

  ${NavigateToFormButtonStyle} {
    min-height: 0;
    height: 32px;
    white-space: nowrap;
  }

  ${PersonIdWithCopyIcon} {
    color: ${palette.pine3};
    :hover,
    :focus {
      background-color: ${palette.marble5};
    }
    /* Increase size of target for click-to-copy when within a table cell */
    padding-top: ${rem(spacing.sm + spacing.xs)};
    padding-bottom: ${rem(spacing.sm + spacing.xs)};
  }
`;

const Row = styled.tr<{ $isSelected?: boolean }>`
  border-bottom: 1px solid ${palette.slate10};

  ${Cell} {
    ${({ $isSelected }) => $isSelected && "background-color: #EDF4FC;"}
    transition: all 0.15s ease-in-out;
  }

  :not(:hover, :focus) {
    ${NavigateToFormButtonStyle} {
      display: none;
    }
  }
`;

const TableBody = styled.tbody`
  width: 100%;

  /* Give the hover state to only body rows, not header rows */
  & ${Row} {
    :hover,
    :focus {
      background-color: ${palette.marble2};
      cursor: pointer;
    }
  }
`;

const svgPathFillCSS = `
  fill-opacity: 1 !important;
  fill: ${palette.pine3}
`;

const SortIconWrapper = styled.div<{
  $sortDirection: false | SortDirection;
}>`
  color: ${palette.slate30};

  ${({ $sortDirection }) => {
    if ($sortDirection === "asc") {
      return `
          svg > path:first-child {
            ${svgPathFillCSS}
          }
        `;
    }
    if ($sortDirection === "desc") {
      return `
          svg > path:last-child {
            ${svgPathFillCSS}
          }
        `;
    }
    return "";
  }};
`;

export type CaseloadTableManualSorting = {
  sorting: SortingState;
  setSorting: Dispatch<SetStateAction<SortingState>>;
};

type CaseloadTableProps<TData> = {
  data: TData[];
  columns: ColumnDef<TData>[];
  expandedLastColumn?: boolean;
  onRowClick: (row: TData) => void;
  shouldHighlightRow: (row: TData) => boolean;
  onRowRender?: (row: TData) => void;
  manualSorting?: CaseloadTableManualSorting;
};

export const CaseloadTable = observer(function CaseloadTable<TData>({
  expandedLastColumn = false,
  data,
  columns,
  onRowClick,
  shouldHighlightRow,
  onRowRender = () => undefined,
  manualSorting = undefined,
}: CaseloadTableProps<TData>) {
  const { isMobile } = useIsMobile(true);
  const table = useReactTable({
    data,
    columns: columns,
    getSortedRowModel: getSortedRowModel(),
    getCoreRowModel: getCoreRowModel(),
    ...(manualSorting
      ? {
          manualSorting: true,
          onSortingChange: manualSorting.setSorting,
          state: { sorting: manualSorting?.sorting },
        }
      : {}),
  });

  return (
    <Table>
      <TableHeader>
        {table.getHeaderGroups().map((headerGroup) => (
          <Row key={headerGroup.id}>
            {headerGroup.headers.map((header) => (
              <HeaderCell key={header.id}>
                <SortableHeader
                  $sortable={header.column.getCanSort()}
                  onClick={header.column.getToggleSortingHandler()}
                >
                  {flexRender(
                    header.column.columnDef.header,
                    header.getContext(),
                  )}
                  {header.column.getCanSort() && (
                    <SortIconWrapper
                      $sortDirection={header.column.getIsSorted()}
                    >
                      <SortIcon />
                    </SortIconWrapper>
                  )}
                </SortableHeader>
              </HeaderCell>
            ))}
          </Row>
        ))}
      </TableHeader>
      <TableBody>
        {table.getRowModel().rows.map((row) => {
          onRowRender(row.original);
          return (
            <Row
              key={row.id}
              onClick={() => {
                onRowClick(row.original);
              }}
              $isSelected={shouldHighlightRow(row.original)}
            >
              {row.getVisibleCells().map((cell) => (
                <Cell
                  key={cell.id}
                  className={"fs-exclude"}
                  $expandedLastColumn={expandedLastColumn}
                  $isMobile={isMobile}
                >
                  {flexRender(cell.column.columnDef.cell, cell.getContext())}
                </Cell>
              ))}
            </Row>
          );
        })}
      </TableBody>
    </Table>
  );
});
