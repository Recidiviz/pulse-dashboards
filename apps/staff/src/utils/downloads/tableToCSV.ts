// Recidiviz - a data platform for criminal justice reform
// Copyright (C) 2026 Recidiviz, Inc.
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

import { AccessorFnColumnDef, ColumnDef } from "@tanstack/react-table";
import { saveAs } from "file-saver";

import { formatDate } from "~utils";

/**
 * Converts tabular data to a CSV string using TanStack React Table v8 column definitions.
 *
 * Only columns with an `accessorFn` or `accessorKey` are included in the export.
 * Columns that only define a `cell` renderer (e.g. action buttons, toggles) are skipped.
 * To ensure a column's data appears in CSV exports, add an `accessorFn` or `accessorKey`
 * to its column definition.
 */

export function tableToCSV<TData>(
  data: TData[],
  columns: ColumnDef<TData, any>[],
): string {
  const exportableColumns = columns.filter(
    (col) => "accessorFn" in col || "accessorKey" in col,
  );

  const headers = exportableColumns.map((col) => {
    const header = col.header;
    // Column headers are typically strings; if not, fall back to the column id
    if (typeof header === "string") return header;
    return col.id ?? "";
  });

  const rows = data.map((row) =>
    exportableColumns.map((col) => {
      let value: unknown;
      if ("accessorFn" in col) {
        value = (col as AccessorFnColumnDef<TData, any>).accessorFn(row, 0);
      } else if ("accessorKey" in col) {
        value = (row as Record<string, unknown>)[col.accessorKey as string];
      }
      return formatCSVValue(value);
    }),
  );

  const csvLines = [
    headers.map(formatCSVValue).join(","),
    ...rows.map((row) => row.join(",")),
  ];

  return csvLines.join("\n");
}

const CSV_DATE_FORMAT = "MM/dd/yyyy";

// Detects Firestore Timestamp-like objects (has seconds/nanoseconds and a toDate method)
function isTimestampLike(
  value: unknown,
): value is { toDate(): Date; seconds: number } {
  return (
    typeof value === "object" &&
    value !== null &&
    "seconds" in value &&
    typeof (value as Record<string, unknown>).toDate === "function"
  );
}

function formatCSVValue(value: unknown): string {
  if (value === null || value === undefined) return "";

  // Handle Firestore Timestamps (e.g. lastViewed.date)
  if (isTimestampLike(value)) {
    return formatDate(value.toDate(), CSV_DATE_FORMAT);
  }

  // Handle JS Date objects
  if (value instanceof Date) {
    return formatDate(value, CSV_DATE_FORMAT);
  }

  const str = String(value);

  // Wrap in quotes if the value contains commas, quotes, or newlines
  if (str.includes(",") || str.includes('"') || str.includes("\n")) {
    return `"${str.replace(/"/g, '""')}"`;
  }

  return str;
}

export function downloadTableCSV<TData>(
  data: TData[],
  columns: ColumnDef<TData, any>[],
  filename: string,
): void {
  const csv = tableToCSV(data, columns);
  const blob = new Blob([csv], { type: "text/csv;charset=utf-8" });
  const base = filename.endsWith(".csv") ? filename.slice(0, -4) : filename;
  const timestamp = formatDate(new Date(), "yyyy-MM-dd-HHmm");
  saveAs(blob, `${base} ${timestamp}.csv`);
}
