// Recidiviz - a data platform for criminal justice reform
// Copyright (C) 2021 Recidiviz, Inc.
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

import "./PathwaysTable.scss";

import cx from "classnames";
import React, { useCallback, useEffect, useMemo } from "react";
import { useFlexLayout, useSortBy, useTable } from "react-table";
import AutoSizer from "react-virtualized-auto-sizer";
import { VariableSizeList as List } from "react-window";

import getScrollBarWidth from "../../utils/getScrollBarWidth";

type Props = {
  columns: any;
  data: any;
};

const PathwaysTable: React.FC<Props> = ({ columns, data }) => {
  const {
    getTableProps,
    getTableBodyProps,
    headerGroups,
    rows,
    prepareRow,
  } = useTable(
    {
      columns,
      data,
    },
    useSortBy,
    useFlexLayout
  );

  const scrollBarSize = useMemo(() => getScrollBarWidth(), []);

  const RenderRow = useCallback(
    ({ index, style }) => {
      const row = rows[index];
      prepareRow(row);
      return (
        <div className="tr" {...row.getRowProps({ style })}>
          {row.cells.map((cell) => {
            return (
              <div
                className="td"
                {...cell.getCellProps(
                  ["Age", "Facility"].includes(String(cell.column.Header))
                    ? { style: { wordSpacing: "100vw" } }
                    : {}
                )}
              >
                {cell.render("Cell")}
              </div>
            );
          })}
        </div>
      );
    },
    [prepareRow, rows]
  );

  const getItemSize = (index: number) => {
    const row = rows[index];
    const rowFactor = row.values.age.match(/,/g)?.length;
    const rowHeights = new Array(rows.length)
      .fill(true)
      .map(() => (rowFactor !== 1 && rowFactor * 40) || 70);
    return rowHeights[index];
  };

  const listRef: React.LegacyRef<List> = React.createRef();

  useEffect(() => {
    // eslint-disable-next-line
    listRef.current?.resetAfterIndex(0);
  }, [listRef]);

  return (
    <div className="PathwaysTable" {...getTableProps()}>
      <div className="PathwaysTable__head">
        {headerGroups.map((headerGroup) => (
          <div className="tr" {...headerGroup.getHeaderGroupProps()}>
            {headerGroup.headers.map((column) => (
              <div
                className="th"
                {...column.getHeaderProps(column.getSortByToggleProps())}
              >
                {column.canSort ? (
                  <div className="PathwaysTable__head--sortable">
                    {column.render("Header")}
                    <div className="VitalsSummaryTable__sort">
                      <div
                        className={cx(
                          "VitalsSummaryTable__sort__button VitalsSummaryTable__sort__button--up",
                          {
                            "VitalsSummaryTable__sort__button--active":
                              column.isSorted && column.isSortedDesc,
                          }
                        )}
                      />
                      <div
                        className={cx(
                          "VitalsSummaryTable__sort__button VitalsSummaryTable__sort__button--down",
                          {
                            "VitalsSummaryTable__sort__button--active":
                              column.isSorted && !column.isSortedDesc,
                          }
                        )}
                      />
                    </div>
                  </div>
                ) : (
                  column.render("Header")
                )}
              </div>
            ))}
          </div>
        ))}
      </div>
      <div className="PathwaysTable__body" {...getTableBodyProps()}>
        <AutoSizer>
          {({ height, width }) => (
            <List
              ref={listRef}
              height={height}
              itemCount={rows.length}
              itemSize={getItemSize}
              width={width + scrollBarSize}
            >
              {RenderRow}
            </List>
          )}
        </AutoSizer>
      </div>
    </div>
  );
};

export default PathwaysTable;
