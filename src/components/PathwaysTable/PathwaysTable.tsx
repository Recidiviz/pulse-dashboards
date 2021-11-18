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
import React, { useCallback, useMemo } from "react";
import { useFlexLayout, useSortBy, useTable } from "react-table";
import AutoSizer from "react-virtualized-auto-sizer";
import { FixedSizeList as List } from "react-window";

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
              <div className="td" {...cell.getCellProps()}>
                {cell.render("Cell")}
              </div>
            );
          })}
        </div>
      );
    },
    [prepareRow, rows]
  );

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
                    <div className="PracticesSummaryTable__sort">
                      <div
                        className={cx(
                          "PracticesSummaryTable__sort__button PracticesSummaryTable__sort__button--up",
                          {
                            "PracticesSummaryTable__sort__button--active":
                              column.isSorted && column.isSortedDesc,
                          }
                        )}
                      />
                      <div
                        className={cx(
                          "PracticesSummaryTable__sort__button PracticesSummaryTable__sort__button--down",
                          {
                            "PracticesSummaryTable__sort__button--active":
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
              height={height}
              itemCount={rows.length}
              itemSize={70}
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
