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

import { ColumnDef } from "@tanstack/react-table";
import { saveAs } from "file-saver";
import { vi } from "vitest";

import { downloadTableCSV, tableToCSV } from "../tableToCSV";

vi.mock("file-saver", () => ({
  saveAs: vi.fn(),
}));

type TestRow = {
  name: string;
  age: number;
  city: string;
};

const testData: TestRow[] = [
  { name: "Alice", age: 30, city: "Portland" },
  { name: "Bob", age: 25, city: "Seattle" },
];

const columns: ColumnDef<TestRow>[] = [
  { header: "Name", accessorFn: (row) => row.name },
  { header: "Age", accessorKey: "age" },
  { header: "City", accessorFn: (row) => row.city },
];

describe("tableToCSV", () => {
  it("generates CSV with headers and rows", () => {
    const csv = tableToCSV(testData, columns);
    expect(csv).toBe("Name,Age,City\nAlice,30,Portland\nBob,25,Seattle");
  });

  it("skips columns without accessorFn or accessorKey", () => {
    const columnsWithCellOnly: ColumnDef<TestRow>[] = [
      ...columns,
      {
        id: "actions",
        header: "Actions",
        cell: () => "button",
      },
    ];
    const csv = tableToCSV(testData, columnsWithCellOnly);
    expect(csv).toBe("Name,Age,City\nAlice,30,Portland\nBob,25,Seattle");
  });

  it("escapes values containing commas", () => {
    const data = [{ name: "Smith, John", age: 40, city: "Portland" }];
    const csv = tableToCSV(data, columns);
    expect(csv).toBe('Name,Age,City\n"Smith, John",40,Portland');
  });

  it("escapes values containing double quotes", () => {
    const data = [{ name: 'They call him "Bob"', age: 25, city: "Seattle" }];
    const csv = tableToCSV(data, columns);
    expect(csv).toBe('Name,Age,City\n"They call him ""Bob""",25,Seattle');
  });

  it("escapes values containing newlines", () => {
    const data = [{ name: "Line1\nLine2", age: 25, city: "Seattle" }];
    const csv = tableToCSV(data, columns);
    expect(csv).toBe('Name,Age,City\n"Line1\nLine2",25,Seattle');
  });

  it("handles null and undefined values", () => {
    const nullableColumns: ColumnDef<Partial<TestRow>>[] = [
      { header: "Name", accessorFn: (row) => row.name },
      { header: "Age", accessorFn: (row) => row.age },
    ];
    const data: Partial<TestRow>[] = [
      { name: "Alice", age: undefined },
      { name: undefined, age: 30 },
    ];
    const csv = tableToCSV(data, nullableColumns);
    expect(csv).toBe("Name,Age\nAlice,\n,30");
  });

  it("handles empty data", () => {
    const csv = tableToCSV([], columns);
    expect(csv).toBe("Name,Age,City");
  });

  it("falls back to column id when header is not a string", () => {
    const columnsWithNonStringHeader: ColumnDef<TestRow>[] = [
      { id: "name_col", header: () => "Name", accessorFn: (row) => row.name },
    ];
    const csv = tableToCSV(testData, columnsWithNonStringHeader);
    expect(csv).toBe("name_col\nAlice\nBob");
  });

  it("formats Date objects as MM/DD/YYYY", () => {
    type DateRow = { date: Date };
    const dateColumns: ColumnDef<DateRow>[] = [
      { header: "Date", accessorFn: (row) => row.date },
    ];
    const data = [{ date: new Date(2025, 2, 20) }]; // March 20, 2025
    const csv = tableToCSV(data, dateColumns);
    expect(csv).toBe("Date\n03/20/2025");
  });

  it("formats Firestore Timestamp-like objects as MM/DD/YYYY", () => {
    type TimestampRow = {
      lastViewed: { seconds: number; nanoseconds: number; toDate: () => Date };
    };
    const tsColumns: ColumnDef<TimestampRow>[] = [
      { header: "Last Viewed", accessorFn: (row) => row.lastViewed },
    ];
    const data = [
      {
        lastViewed: {
          seconds: 1750864565,
          nanoseconds: 908000000,
          toDate: () => new Date(1750864565 * 1000),
        },
      },
    ];
    const csv = tableToCSV(data, tsColumns);
    expect(csv).toBe("Last Viewed\n06/25/2025");
  });
});

describe("downloadTableCSV", () => {
  it("triggers saveAs with a CSV blob and .csv filename", () => {
    downloadTableCSV(testData, columns, "test-export");

    expect(saveAs).toHaveBeenCalledWith(expect.any(Blob), "test-export.csv");

    const blob = (saveAs as unknown as ReturnType<typeof vi.fn>).mock
      .calls[0][0] as Blob;
    expect(blob.type).toBe("text/csv;charset=utf-8");
  });

  it("does not double-append .csv extension", () => {
    downloadTableCSV(testData, columns, "test-export.csv");

    expect(saveAs).toHaveBeenCalledWith(expect.any(Blob), "test-export.csv");
  });
});
