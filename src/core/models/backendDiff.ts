/*
 * Recidiviz - a data platform for criminal justice reform
 * Copyright (C) 2022 Recidiviz, Inc.
 *
 * This program is free software: you can redistribute it and/or modify
 * it under the terms of the GNU General Public License as published by
 * the Free Software Foundation, either version 3 of the License, or
 * (at your option) any later version.
 *
 * This program is distributed in the hope that it will be useful,
 * but WITHOUT ANY WARRANTY; without even the implied warranty of
 * MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.  See the
 * GNU General Public License for more details.
 *
 * You should have received a copy of the GNU General Public License
 * along with this program.  If not, see <https://www.gnu.org/licenses/>.
 * =============================================================================
 *
 */
import { TimeSeriesDataRecord } from "./types";

export type timeSeriesDiffValue = {
  oldValue: number | undefined;
  newValue: number | undefined;
};

export function diffTimeSeriesData(
  oldData: TimeSeriesDataRecord[],
  newData: TimeSeriesDataRecord[]
): Map<string, timeSeriesDiffValue> {
  const diffs = new Map<string, timeSeriesDiffValue>();

  const oldResults = new Map<string, number>();
  oldData.forEach((value) => {
    // Use year-month as the key because strings can be compared for equality by value,
    // whereas objects must refer to the same instance of the object to be considered equal.
    oldResults.set(`${value.year}-${value.month}`, value.count);
  });

  const newResults = new Map<string, number>();
  newData.forEach((value) => {
    const key = `${value.year}-${value.month}`;
    newResults.set(key, value.count);

    const oldValue = oldResults.get(key) || 0;
    const newValue = value.count || 0;
    if (oldValue !== newValue) {
      diffs.set(key, {
        oldValue,
        newValue,
      });
    }
  });

  oldResults.forEach((value, key) => {
    const oldValue = value || 0;
    const newValue = newResults.get(key) || 0;
    if (oldValue !== newValue) {
      // Since we're using maps with string keys, we don't need to check if a diff is already
      // accounted for- we can just re-add it and it will dedupe itself.
      diffs.set(key, {
        oldValue,
        newValue,
      });
    }
  });

  return diffs;
}

/**
 * Represents a difference between old/new API values for a given Pathways request.
 * It is used for developer debugging purposes.
 */
export class DiffError extends Error {
  constructor(message: string) {
    super(message);
    this.name = this.constructor.name;
  }
}
