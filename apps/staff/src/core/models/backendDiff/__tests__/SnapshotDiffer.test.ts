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
import { SnapshotDiffer, SnapshotDiffType } from "../SnapshotDiffer";

const differ: SnapshotDiffer = new SnapshotDiffer("ageGroup");

it("diffs equal data out of order", () => {
  const oldData: SnapshotDataRecord[] = [
    {
      ageGroup: "25-29",
      count: 10,
      lastUpdated: new Date(2022, 5, 1),
    },
    {
      ageGroup: "30-34",
      count: 20,
      lastUpdated: new Date(2022, 5, 1),
    },
  ];
  const newData: SnapshotDataRecord[] = [
    {
      ageGroup: "30-34",
      count: 20,
      lastUpdated: new Date(2022, 5, 1),
    },
    {
      ageGroup: "25-29",
      count: 10,
      lastUpdated: new Date(2022, 5, 1),
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
      lastUpdated: new Date(2022, 5, 1),
    },
    // Exists in old only
    {
      ageGroup: "30-34",
      count: 20,
      lastUpdated: new Date(2022, 5, 1),
    },
    {
      ageGroup: "35-39",
      count: 0,
      lastUpdated: new Date(2022, 5, 1),
    },
    // Exists in both
    {
      ageGroup: "40-44",
      count: 30,
      lastUpdated: new Date(2022, 5, 1),
    },
  ];

  const newData: SnapshotDataRecord[] = [
    // Exists in new only
    {
      ageGroup: "50-54",
      count: 1,
      lastUpdated: new Date(2022, 5, 1),
    },
    // Exists in both
    {
      ageGroup: "40-44",
      count: 30,
      lastUpdated: new Date(2022, 5, 1),
    },
    // Exists in old but with different count
    {
      ageGroup: "25-29",
      count: 100,
      lastUpdated: new Date(2022, 5, 1),
    },
  ];

  const expectedDiffs: Map<string, DiffValue<SnapshotDiffType>> = new Map<
    string,
    DiffValue<SnapshotDiffType>
  >();

  expectedDiffs.set("25-29", {
    oldValue: { count: 10, lastUpdated: new Date(2022, 5, 1) },
    newValue: { count: 100, lastUpdated: new Date(2022, 5, 1) },
  });
  expectedDiffs.set("30-34", {
    oldValue: { count: 20, lastUpdated: new Date(2022, 5, 1) },
    newValue: { count: 0, lastUpdated: undefined },
  });
  expectedDiffs.set("50-54", {
    oldValue: { count: 0, lastUpdated: undefined },
    newValue: { count: 1, lastUpdated: new Date(2022, 5, 1) },
  });
  const expectedDiffOutput: Diff<SnapshotDiffType> = {
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
      lastUpdated: new Date(2022, 5, 1),
    },
    {
      ageGroup: "30-34",
      gender: "FEMALE",
      count: 20,
      lastUpdated: new Date(2022, 5, 1),
    },
  ];
  const newData: SnapshotDataRecord[] = [
    {
      ageGroup: "30-34",
      count: 20,
      lastUpdated: new Date(2022, 5, 1),
    },
    {
      ageGroup: "25-29",
      count: 10,
      lastUpdated: new Date(2022, 5, 1),
    },
  ];

  expect(differ.diff(oldData, newData).totalDiffs).toEqual(0);
  expect(differ.diff(oldData, newData).samples.entries).toHaveLength(0);
});
