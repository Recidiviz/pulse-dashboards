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

import { TimeSeriesDataRecord } from "../../types";
import { DiffValue } from "../Differ";
import { TimeSeriesDiffer } from "../TimeSeriesDiffer";

const differ: TimeSeriesDiffer = new TimeSeriesDiffer();

it("diffs equal data out of order", () => {
  const oldData: TimeSeriesDataRecord[] = [
    {
      year: 2020,
      month: 1,
      count: 10,
    },
    {
      year: 2020,
      month: 2,
      count: 20,
    },
  ];
  const newData: TimeSeriesDataRecord[] = [
    {
      year: 2020,
      month: 2,
      count: 20,
    },
    {
      year: 2020,
      month: 1,
      count: 10,
    },
  ];

  expect(differ.diff(oldData, newData).entries).toHaveLength(0);
});

it("diffs unequal data", () => {
  const oldData: TimeSeriesDataRecord[] = [
    // Exists in new but with different count
    {
      year: 2020,
      month: 1,
      count: 10,
    },
    // Exists in old only
    {
      year: 2020,
      month: 2,
      count: 20,
    },
    {
      year: 2020,
      month: 4,
      count: 0,
    },
    // Exists in both
    {
      year: 2020,
      month: 3,
      count: 30,
    },
  ];

  const newData: TimeSeriesDataRecord[] = [
    // Exists in new only
    {
      year: 2022,
      month: 1,
      count: 1,
    },
    // Exists in both
    {
      year: 2020,
      month: 3,
      count: 30,
    },
    // Exists in old but with different count
    {
      year: 2020,
      month: 1,
      count: 100,
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
    newValue: 0,
  });
  expectedDiffs.set("2022-1", {
    oldValue: 0,
    newValue: 1,
  });

  expect(differ.diff(oldData, newData)).toEqual(expectedDiffs);
});
