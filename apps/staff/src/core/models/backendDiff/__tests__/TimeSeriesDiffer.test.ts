// Recidiviz - a data platform for criminal justice reform
// Copyright (C) 2024 Recidiviz, Inc.
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

import { TimeSeriesDataRecord } from "../../types";
import { Diff, DiffValue } from "../Differ";
import { TimeSeriesDiffer } from "../TimeSeriesDiffer";

const differ: TimeSeriesDiffer = new TimeSeriesDiffer();

it("diffs equal data out of order", () => {
  const oldData: TimeSeriesDataRecord[] = [
    {
      year: 2020,
      month: 1,
      count: 10,
      avg90day: 5,
    },
    {
      year: 2020,
      month: 2,
      count: 20,
      avg90day: 15,
    },
  ];
  const newData: TimeSeriesDataRecord[] = [
    {
      year: 2020,
      month: 2,
      count: 20,
      avg90day: 15,
    },
    {
      year: 2020,
      month: 1,
      count: 10,
      avg90day: 5,
    },
  ];

  expect(differ.diff(oldData, newData).totalDiffs).toEqual(0);
  expect(differ.diff(oldData, newData).samples.entries).toHaveLength(0);
});

it("diffs unequal data", () => {
  const oldData: TimeSeriesDataRecord[] = [
    // Exists in new but with different count
    {
      year: 2020,
      month: 1,
      count: 10,
      avg90day: 5,
    },
    // Exists in old only
    {
      year: 2020,
      month: 2,
      count: 20,
      avg90day: 15,
    },
    {
      year: 2020,
      month: 4,
      count: 0,
      avg90day: 3,
    },
    // Exists in both
    {
      year: 2020,
      month: 3,
      count: 30,
      avg90day: 10,
    },
  ];

  const newData: TimeSeriesDataRecord[] = [
    // Exists in new only
    {
      year: 2022,
      month: 1,
      count: 1,
      avg90day: 0,
    },
    // Exists in both
    {
      year: 2020,
      month: 3,
      count: 30,
      avg90day: 10,
    },
    // Exists in old but with different count
    {
      year: 2020,
      month: 1,
      count: 100,
      avg90day: 5,
    },
  ];

  const expectedDiffs: Map<string, DiffValue<number>> = new Map<
    string,
    DiffValue<number>
  >();

  expectedDiffs.set("2020-1", {
    oldValue: 10,
    newValue: 100,
  });
  expectedDiffs.set("2020-2", {
    oldValue: 20,
    newValue: undefined,
  });
  expectedDiffs.set("2022-1", {
    oldValue: undefined,
    newValue: 1,
  });
  expectedDiffs.set("2020-4", {
    oldValue: 0,
    newValue: undefined,
  });
  const expectedDiffOutput: Diff<number> = {
    totalDiffs: 4,
    samples: expectedDiffs,
  };

  expect(differ.diff(oldData, newData)).toEqual(expectedDiffOutput);
});
