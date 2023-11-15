// Recidiviz - a data platform for criminal justice reform
// Copyright (C) 2023 Recidiviz, Inc.
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
import { rem, rgba } from "polished";
import React, { useCallback, useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { Column, useFlexLayout, useTable } from "react-table";
import List from "react-virtualized/dist/commonjs/List";
import WindowScroller from "react-virtualized/dist/commonjs/WindowScroller";
import AutoSizer from "react-virtualized-auto-sizer";
import styled from "styled-components/macro";

import useIsMobile from "../../hooks/useIsMobile";

const DEFAULT_TABLE_ROW_SIZE = 50;
const TABLE_MIN_WIDTH = 280;
const TABLE_HIDE_COLUMN_WIDTH = 350;

const Table = styled.div`
  ${typography.Sans14};
  width: 100%;
  text-align: left;
  color: ${palette.slate85};
  border: 1px solid ${palette.slate10};
  border-bottom: 0;
`;

const TableHeader = styled.div`
  color: ${palette.pine2};
`;

const TableBody = styled.div``;

const TH = styled.div`
  background: ${palette.marble3};
  padding: ${rem(spacing.md)};
`;

const TR = styled.div<{ transformToMobile?: boolean }>`
  display: flex;
  border-bottom: 1px solid ${palette.slate10};

  ${({ transformToMobile }) =>
    transformToMobile &&
    `flex-direction: column; gap: ${rem(spacing.xxs)}; padding: ${rem(
      spacing.md
    )};`}
`;

const TD = styled.div<{ transformToMobile?: boolean }>`
  display: flex;
  align-items: center;
  padding: ${({ transformToMobile }) =>
    transformToMobile ? 0 : rem(spacing.md)};

  ${({ transformToMobile }) => transformToMobile && `width: 100% !important;`}
`;

const Text = styled.div`
  border-bottom: 1px solid transparent;
`;

const StyledLink = styled(Link)`
  color: inherit !important;

  &:hover ${TR} {
    background: ${rgba(palette.signal.highlight, 0.05)};
  }
  &:hover ${TD}:first-child ${Text} {
    color: ${palette.signal.links};
    border-bottom: 1px solid ${palette.signal.links};
  }
`;

type OutlierTableProps<T extends object> = {
  data: T[];
  columns: Column[];
  rowLinks?: string[];
  hiddenColumnId?: string;
  rowSize?: number;
  transformToMobile?: boolean;
  scrollElement?: any;
};

const OutliersTable = <T extends object>({
  data,
  columns,
  rowLinks,
  scrollElement,
  hiddenColumnId = "clientId",
  rowSize = DEFAULT_TABLE_ROW_SIZE,
  transformToMobile = false,
}: OutlierTableProps<T>) => {
  const { isMobile } = useIsMobile(true);
  const [isColumnHidden, hideColumn] = useState(false);

  const {
    getTableProps,
    getTableBodyProps,
    headerGroups,
    rows,
    prepareRow,
    toggleHideColumn,
  } = useTable(
    {
      columns,
      data,
    },
    useFlexLayout
  );

  const handleHideColumnWidth = useCallback((ref, width) => {
    if (ref) {
      if (width < TABLE_HIDE_COLUMN_WIDTH) {
        hideColumn(true);
      } else {
        hideColumn(false);
      }
    }
  }, []);

  useEffect(() => {
    toggleHideColumn(hiddenColumnId, isColumnHidden || isMobile);
  }, [isColumnHidden, isMobile, toggleHideColumn, hiddenColumnId]);

  const RenderRow = useCallback(
    ({ index, style }) => {
      const row = rows[index];
      prepareRow(row);

      const rowViz = (
        <TR
          transformToMobile={transformToMobile}
          {...row.getRowProps({ style })}
        >
          {row.cells.map((cell) => {
            return (
              <TD
                transformToMobile={transformToMobile}
                {...cell.getCellProps()}
              >
                <Text>{cell.render("Cell")}</Text>
              </TD>
            );
          })}
        </TR>
      );

      return rowLinks ? (
        <StyledLink key={index} to={rowLinks[index]}>
          {rowViz}
        </StyledLink>
      ) : (
        rowViz
      );
    },
    [prepareRow, rows, rowLinks, transformToMobile]
  );

  return (
    <Table {...getTableProps({ style: { minWidth: TABLE_MIN_WIDTH } })}>
      {!transformToMobile && (
        <TableHeader>
          {headerGroups.map((headerGroup) => (
            <TR {...headerGroup.getHeaderGroupProps()}>
              {headerGroup.headers.map((column) => (
                <TH {...column.getHeaderProps()}>{column.render("title")}</TH>
              ))}
            </TR>
          ))}
        </TableHeader>
      )}
      <TableBody
        {...getTableBodyProps({
          style: {
            height: rows.length * rowSize,
          },
        })}
      >
        <AutoSizer>
          {({ width }) => (
            <WindowScroller
              ref={(ref) => handleHideColumnWidth(ref, width)}
              scrollElement={scrollElement || window}
            >
              {({ height, isScrolling, onChildScroll, scrollTop }) => (
                <List
                  autoHeight
                  height={height}
                  isScrolling={isScrolling}
                  onScroll={onChildScroll}
                  rowCount={rows.length}
                  rowHeight={rowSize}
                  rowRenderer={RenderRow}
                  scrollTop={scrollTop}
                  width={width}
                />
              )}
            </WindowScroller>
          )}
        </AutoSizer>
      </TableBody>
    </Table>
  );
};

export default OutliersTable;
