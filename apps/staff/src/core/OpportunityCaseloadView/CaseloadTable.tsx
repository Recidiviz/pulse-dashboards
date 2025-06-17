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

import { spacing, typography } from "@recidiviz/design-system";
import {
  ColumnDef,
  flexRender,
  getCoreRowModel,
  getPaginationRowModel,
  getSortedRowModel,
  SortDirection,
  SortingState,
  TableState,
  useReactTable,
} from "@tanstack/react-table";
import { observer } from "mobx-react-lite";
import { rem } from "polished";
import { Dispatch, SetStateAction, useState } from "react";
import styled from "styled-components/macro";

import { palette } from "~design-system";

import SortIcon from "../../assets/static/images/sortIcon.svg?react";
import useIsMobile from "../../hooks/useIsMobile";
import { NavigateToFormButtonStyle } from "../../WorkflowsStore/Opportunity/Forms/NavigateToFormButton";
import { NAV_BAR_HEIGHT } from "../NavigationLayout";
import { PersonIdWithCopyIcon } from "../PersonId/PersonId";

const Table = styled.table`
  width: 100%;
  ${typography.Sans14};
  text-align: left;

  border-collapse: separate;
  border-spacing: 0;
  flex: 1 1 auto;
`; // necessary to keep the border at the bottom of the sticky table header

const ScrollContainer = styled.div<{ $isMobile: boolean }>`
  ${({ $isMobile }) => $isMobile && `overflow-x: scroll;`}
`;

const SortableHeader = styled.div<{ $sortable?: boolean }>`
  display: inline-flex;
  align-items: center;
  gap: ${rem(spacing.sm)};
  cursor: ${({ $sortable }) => ($sortable ? "pointer" : "default")};
`;

const TableHeader = styled.thead<{
  $isMobile: boolean;
}>`
  position: sticky;
  top: ${({ $isMobile }) => ($isMobile ? 0 : rem(NAV_BAR_HEIGHT))};

  width: 100%;
  background-color: ${palette.marble1};
`;

const SharedTableCellStyles = `
  height: 49px;
  padding: ${rem(spacing.xs)} ${rem(spacing.sm)};
  border-bottom: 1px solid ${palette.slate10};
`;

const HeaderCell = styled.th`
  ${SharedTableCellStyles}
  color: ${palette.slate80};
  font-weight: unset;
  user-select: none;
`;

const Cell = styled.td<{
  $expandedLastColumn: boolean;
  $isMobile: boolean;
  $columns: number;
}>`
  ${SharedTableCellStyles}

  color: ${palette.pine1};

  ${({ $columns }) =>
    /* If there are more than 7 columns, make columns accordingly narrower */
    $columns > 7 ? `width: calc(91% / ${$columns});` : `width: 13%;`}

  ${({ $isMobile }) => ($isMobile ? `min-width: 100px;` : `min-width: 125px;`)}

  ${({ $expandedLastColumn }) =>
    /* Offset last column to fill all available space */
    $expandedLastColumn &&
    `&:last-child {
    width: auto;
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

const LoadMoreRows = styled.button`
  ${typography.Sans18};
  width: fit-content;
  display: flex;
  justify-content: center;
  align-items: center;
  color: ${palette.pine4};
  margin: ${rem(spacing.md)} auto ${rem(spacing.xl)} auto;
  border: none;
  background-color: transparent;

  &:hover {
    cursor: pointer;
  }
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
  enableMultiSort?: boolean;
  initialState?: Partial<TableState>;
  enableProgressiveLoading?: boolean;
  progressiveLoadingBatchSize?: number;
};

export const CaseloadTable = observer(function CaseloadTable<TData>({
  expandedLastColumn = false,
  data,
  columns,
  onRowClick,
  shouldHighlightRow,
  onRowRender = () => undefined,
  manualSorting = undefined,
  enableMultiSort = false,
  initialState = undefined,
  enableProgressiveLoading = false,
  progressiveLoadingBatchSize = 0,
}: CaseloadTableProps<TData>) {
  const { isMobile } = useIsMobile(true);

  /*
   * NOTE: When progressive loading is enabled, the column sorting will sort the entire dataset
   *       and not exclusively the rows that are currently displayed.
   */
  const [progressiveLoading, setProgressiveLoading] = useState({
    pageIndex: 0,
    pageSize: progressiveLoadingBatchSize,
  });

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
    ...(enableMultiSort
      ? {
          enableMultiSort: true,
          isMultiSortEvent: (_) => true,
          maxMultiSortColCount: 3,
        }
      : {}),
    ...(enableProgressiveLoading
      ? { getPaginationRowModel: getPaginationRowModel() }
      : {}),
    initialState,
    state: {
      ...(enableProgressiveLoading ? { pagination: progressiveLoading } : {}),
    },
  });

  const showLoadMoreButton =
    enableProgressiveLoading &&
    progressiveLoading.pageSize &&
    data.length > progressiveLoading.pageSize;

  const loadMoreRows = () => {
    setProgressiveLoading((prev) => ({
      ...prev,
      pageSize: prev.pageSize + progressiveLoadingBatchSize,
    }));
  };

  return (
    <ScrollContainer $isMobile={isMobile}>
      <Table>
        <TableHeader $isMobile={isMobile}>
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
                    $columns={columns.length}
                  >
                    {flexRender(cell.column.columnDef.cell, cell.getContext())}
                  </Cell>
                ))}
              </Row>
            );
          })}
        </TableBody>
      </Table>
      {showLoadMoreButton && (
        <LoadMoreRows onClick={loadMoreRows}>Load more</LoadMoreRows>
      )}
    </ScrollContainer>
  );
});
