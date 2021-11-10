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
import React from "react";
import { useSortBy, useTable } from "react-table";

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
    useSortBy
  );

  return (
    <table className="PathwaysTable" {...getTableProps()}>
      <thead className="PathwaysTable__head">
        {headerGroups.map((headerGroup) => (
          <tr {...headerGroup.getHeaderGroupProps()}>
            {headerGroup.headers.map((column) => (
              <th {...column.getHeaderProps(column.getSortByToggleProps())}>
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
              </th>
            ))}
          </tr>
        ))}
      </thead>
      <tbody {...getTableBodyProps()}>
        {rows.map((row, i) => {
          prepareRow(row);
          return (
            <tr {...row.getRowProps()}>
              {row.cells.map((cell) => {
                return <td {...cell.getCellProps()}>{cell.render("Cell")}</td>;
              })}
            </tr>
          );
        })}
      </tbody>
    </table>
  );
};

export default PathwaysTable;
