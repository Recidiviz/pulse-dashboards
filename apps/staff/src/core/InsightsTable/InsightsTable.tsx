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
import { defer } from "lodash";
import { rem, rgba } from "polished";
import {
  MutableRefObject,
  useCallback,
  useEffect,
  useRef,
  useState,
} from "react";
import { Link, useLocation } from "react-router-dom";
import { Column, useFlexLayout, useTable } from "react-table";
import WindowScroller from "react-virtualized/dist/commonjs/WindowScroller";
import AutoSizer from "react-virtualized-auto-sizer";
import { FixedSizeList, FixedSizeList as List } from "react-window";
import styled from "styled-components/macro";

import useIsMobile from "../../hooks/useIsMobile";

const DEFAULT_TABLE_ROW_SIZE = 50;
const TABLE_MIN_WIDTH = 200;
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
      spacing.md,
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
  intercomTargetOnFirstRow?: string;
};

const InsightsTable = <T extends object>({
  data,
  columns,
  rowLinks,
  scrollElement,
  hiddenColumnId = "clientId",
  rowSize = DEFAULT_TABLE_ROW_SIZE,
  transformToMobile = false,
  intercomTargetOnFirstRow,
}: OutlierTableProps<T>) => {
  const { isMobile } = useIsMobile(true);
  const [isColumnHidden, hideColumn] = useState(false);
  const [scrollIndex, setScrollIndex] = useState(0);
  const location = useLocation();

  const listRef = useRef<FixedSizeList>(
    null,
  ) as MutableRefObject<FixedSizeList>;
  useEffect(() => {
    listRef.current?.scrollToItem(scrollIndex);
  }, [scrollIndex]);

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
    useFlexLayout,
  );

  const handleHideColumnWidth = useCallback(
    (ref: WindowScroller | null, width: number) => {
      if (ref) {
        defer(() => hideColumn(width < TABLE_HIDE_COLUMN_WIDTH));
      }
    },
    [],
  );

  const RenderRow = useCallback<FixedSizeList["props"]["children"]>(
    ({ index, style }) => {
      const row = rows[index];
      prepareRow(row);
      toggleHideColumn(hiddenColumnId, isColumnHidden || isMobile);

      const rowViz = (
        <TR
          transformToMobile={transformToMobile}
          data-intercom-target={
            intercomTargetOnFirstRow && index === 0
              ? intercomTargetOnFirstRow
              : undefined
          }
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
        <StyledLink
          key={index}
          to={rowLinks[index]}
          state={{ from: location.pathname }}
          onClick={() => setScrollIndex(index)}
        >
          {rowViz}
        </StyledLink>
      ) : (
        rowViz
      );
    },
    [
      prepareRow,
      rows,
      rowLinks,
      transformToMobile,
      location.pathname,
      intercomTargetOnFirstRow,
      isColumnHidden,
      isMobile,
      toggleHideColumn,
      hiddenColumnId,
    ],
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
              {({ height }) => {
                // If there is a scroll element, find the height of the element
                // minus the height of the header, minus the border for the listHeight.
                // Otherwise the list height is the number of rows * height of each row.
                const listHeight = scrollElement
                  ? height - rowSize - 1
                  : rows.length * rowSize;
                return (
                  <List
                    ref={listRef}
                    height={listHeight}
                    itemCount={rows.length}
                    itemSize={rowSize}
                    width={width}
                  >
                    {RenderRow}
                  </List>
                );
              }}
            </WindowScroller>
          )}
        </AutoSizer>
      </TableBody>
    </Table>
  );
};

export default InsightsTable;