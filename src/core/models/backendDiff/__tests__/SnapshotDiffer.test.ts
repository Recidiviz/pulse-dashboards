// Recidiviz - a data platform for criminal justice reform
// Copyright (C) 2022 Recidiviz, Inc.
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

import { SnapshotDataRecord } from "../../types";
import { Diff, DiffValue } from "../Differ";
import { SnapshotDiffer } from "../SnapshotDiffer";

const differ: SnapshotDiffer = new SnapshotDiffer("ageGroup");

it("diffs equal data out of order", () => {
  const oldData: SnapshotDataRecord[] = [
    {
      ageGroup: "25-29",
      count: 10,
    },
    {
      ageGroup: "30-34",
      count: 20,
    },
  ];
  const newData: SnapshotDataRecord[] = [
    {
      ageGroup: "30-34",
      count: 20,
    },
    {
      ageGroup: "25-29",
      count: 10,
    },
  ];

  expect(differ.diff(oldData, newData).totalDiffs).toEqual(0);
  expect(differ.diff(oldData, newData).samples.entries).toHaveLength(0);
});

it("diffs unequal data", () => {
  const oldData: SnapshotDataRecord[] = [
    // Exists in new but with different count
    {
      ageGroup: "25-29",
      count: 10,
    },
    // Exists in old only
    {
      ageGroup: "30-34",
      count: 20,
    },
    {
      ageGroup: "35-39",
      count: 0,
    },
    // Exists in both
    {
      ageGroup: "40-44",
      count: 30,
    },
  ];

  const newData: SnapshotDataRecord[] = [
    // Exists in new only
    {
      ageGroup: "50-54",
      count: 1,
    },
    // Exists in both
    {
      ageGroup: "40-44",
      count: 30,
    },
    // Exists in old but with different count
    {
      ageGroup: "25-29",
      count: 100,
    },
  ];

  const expectedDiffs: Map<string, DiffValue<number>> = new Map<
    string,
    DiffValue<number>
  >();

  expectedDiffs.set("25-29", {
    oldValue: 10,
    newValue: 100,
  });
  expectedDiffs.set("30-34", {
    oldValue: 20,
    newValue: 0,
  });
  expectedDiffs.set("50-54", {
    oldValue: 0,
    newValue: 1,
  });
  const expectedDiffOutput: Diff<number> = {
    totalDiffs: 3,
    samples: expectedDiffs,
  };

  expect(differ.diff(oldData, newData)).toEqual(expectedDiffOutput);
});

it("diffs data with extra fields", () => {
  // SnapshotDiffer should only diff data from the field it's configured to: in this case, "ageGroup".
  // This is becasue the old backend always returns data for all fields, whereas the new one only returns
  // data for the field that was queried.
  const oldData: SnapshotDataRecord[] = [
    {
      ageGroup: "25-29",
      gender: "ALL",
      count: 10,
    },
    {
      ageGroup: "30-34",
      gender: "FEMALE",
      count: 20,
    },
  ];
  const newData: SnapshotDataRecord[] = [
    {
      ageGroup: "30-34",
      count: 20,
    },
    {
      ageGroup: "25-29",
      count: 10,
    },
  ];

  expect(differ.diff(oldData, newData).totalDiffs).toEqual(0);
  expect(differ.diff(oldData, newData).samples.entries).toHaveLength(0);
});
