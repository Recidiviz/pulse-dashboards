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

import {
  ColumnDef,
  getCoreRowModel,
  getSortedRowModel,
  TableState,
  useReactTable,
} from "@tanstack/react-table";
import { useMemo } from "react";

/**
 * A custom hook that preprocesses data for a table by applying initial table state logic if enabled.
 *
 * For example, it can sort a dataset based on the initial sorting state via Tanstack React Table's internal
 * sorting logic and return the sorted dataset.
 */
export const usePreprocessedData = <TData>(
  data: TData[],
  columns: ColumnDef<TData>[],
  enabled: boolean,
  initialState?: Partial<TableState>,
): TData[] => {
  const preprocessedTable = useReactTable({
    data,
    columns,
    getCoreRowModel: getCoreRowModel(),
    getSortedRowModel: getSortedRowModel(),
    initialState,
  });

  return useMemo(() => {
    if (!enabled) {
      return data;
    }
    return preprocessedTable.getRowModel().rows.map((row) => row.original);
  }, [enabled, data, preprocessedTable]);
};
