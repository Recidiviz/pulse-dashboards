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
import "./PracticesSummaryTable.scss";

import cx from "classnames";
import { observer } from "mobx-react-lite";
import React, { useEffect, useMemo } from "react";
import { useSortBy, useTable } from "react-table";

import flags from "../../flags";
import { useCoreStore } from "../CoreStoreProvider";
import { ENTITY_TYPES, EntityType, MetricValueAccessor } from "../models/types";
import {
  METRIC_TYPES,
  MetricTypeLabel,
  PracticesMetric,
} from "../PagePractices/types";
import BubbleTableCell from "./BubbleTableCell";
import DeltaTableCell from "./DeltaTableCell";

function getEntityTypeName(entityType: EntityType): string {
  switch (entityType) {
    case ENTITY_TYPES.LEVEL_1_SUPERVISION_LOCATION:
    case ENTITY_TYPES.LEVEL_2_SUPERVISION_LOCATION:
      return "Office";
    case ENTITY_TYPES.PO:
      return "Officer";
    default:
      throw new Error(`Unknown entity type ${entityType}`);
  }
}

const PracticesSummaryTable: React.FC = () => {
  const { pagePracticesStore } = useCoreStore();
  const {
    selectedMetricId: selectedSortBy,
    childEntitySummaryRows: summaries,
    metrics,
  } = pagePracticesStore;

  const createBubbleTableCell = ({ value }: { value: number }) => (
    <BubbleTableCell value={value} />
  );

  const createDeltaTableCell = ({ value }: { value: number }) => (
    <DeltaTableCell value={value} />
  );
  const { entityType } = summaries[0].entity;

  const overallColumns = useMemo(() => {
    const changeCols = [
      {
        Header: "30D change" as MetricTypeLabel,
        accessor: "overall30Day" as MetricValueAccessor,
        sortType: "basic",
        Cell: createDeltaTableCell,
      },
      {
        Header: "90D change" as MetricTypeLabel,
        accessor: "overall90Day" as MetricValueAccessor,
        sortType: "basic",
        Cell: createDeltaTableCell,
      },
    ];
    const overallCol = metrics
      .filter((m) => m.id === METRIC_TYPES.OVERALL)
      .map((m: PracticesMetric) => ({
        Header: m.name,
        accessor: m.accessor,
        sortType: "basic",
        Cell: createBubbleTableCell,
      }));
    return overallCol.concat(changeCols);
  }, [metrics]);
  const metricColumns = useMemo(() => {
    return metrics
      .filter((m) => m.id !== METRIC_TYPES.OVERALL)
      .map((m: PracticesMetric) => {
        const col = {
          Header: m.name,
          id: m.id,
          accessor: m.accessor,
          sortType: "basic",
          Cell: createBubbleTableCell,
        };
        return col;
      });
  }, [metrics]);
  const data = useMemo(() => summaries, [summaries]);
  const columns = useMemo(
    () => [
      {
        Header: " ",
        columns: [
          {
            Header: getEntityTypeName(entityType),
            accessor: "entity",
            sortType: (rowA: any, rowB: any) => {
              if (
                rowA.original.entity.entityName >
                rowB.original.entity.entityName
              )
                return -1;
              if (
                rowB.original.entity.entityName >
                rowA.original.entity.entityName
              )
                return 1;
              return 0;
            },
            Cell: ({
              value,
            }: {
              value: {
                entityId: string;
                entityName: string;
                entityType: string;
              };
            }) =>
              value.entityType === ENTITY_TYPES.LEVEL_1_SUPERVISION_LOCATION ||
              flags.enablePracticesOfficerView ? (
                <button
                  role="link"
                  type="button"
                  tabIndex={0}
                  className="PracticesSummaryTable__link"
                  onClick={() =>
                    pagePracticesStore.setCurrentEntityId(value.entityId)
                  }
                >
                  {value.entityName}
                </button>
              ) : (
                value.entityName
              ),
          },
        ],
      },
      {
        Header: "Overall across all practices",
        columns: overallColumns,
      },
      {
        Header: "Individual practices",
        columns: metricColumns,
      },
    ],
    [entityType, overallColumns, metricColumns, pagePracticesStore]
  );

  const sortBy = useMemo(() => ({ id: selectedSortBy, desc: false }), [
    selectedSortBy,
  ]);

  const {
    getTableProps,
    getTableBodyProps,
    headerGroups,
    rows,
    setSortBy,
    prepareRow,
  } = useTable(
    {
      columns,
      data,
      initialState: { sortBy: [sortBy] },
    },
    useSortBy
  );

  useEffect(() => {
    setSortBy([sortBy]);
  }, [setSortBy, sortBy]);
  return (
    <div className="PracticesSummaryTable">
      <table {...getTableProps()} className="PracticesSummaryTable__table">
        <thead className="PracticesSummaryTable__table-head">
          {headerGroups.map((headerGroup) => (
            <tr
              {...headerGroup.getHeaderGroupProps()}
              className="PracticesSummaryTable__row"
            >
              {headerGroup.headers.map((column) => (
                <th
                  id={column.id}
                  {...column.getHeaderProps(column.getSortByToggleProps())}
                >
                  {column.canSort ? (
                    <div
                      className={`PracticesSummaryTable__sortable-header PracticesSummaryTable__sortable-header--${column.id}`}
                    >
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
                    <div className="PracticesSummaryTable__header">
                      {column.render("Header")}
                    </div>
                  )}
                </th>
              ))}
            </tr>
          ))}
        </thead>

        <tbody {...getTableBodyProps()}>
          {rows.map((row) => {
            prepareRow(row);

            return (
              <tr
                {...row.getRowProps()}
                className="PracticesSummaryTable__row PracticesSummaryTable__row--value"
              >
                {row.cells.map((cell) => {
                  const { column } = cell;
                  return (
                    <td
                      className={`PracticesSummaryTable__cell--${column.id}`}
                      {...cell.getCellProps()}
                    >
                      {cell.render("Cell")}
                    </td>
                  );
                })}
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
};

export default observer(PracticesSummaryTable);
