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

export type DiffValue<T> = {
  oldValue: T | undefined;
  newValue: T | undefined;
};

/**
 * Base class for diffing results from old and new backends.
 */
export abstract class Differ<DataRecord, DiffValueType> {
  abstract emptyValue: DiffValueType;

  diff(
    oldData: DataRecord[],
    newData: DataRecord[]
  ): Map<string, DiffValue<DiffValueType>> {
    const diffs = new Map<string, DiffValue<DiffValueType>>();

    const oldResults = new Map<string, DiffValueType>();
    oldData.forEach((value) => {
      oldResults.set(this.getKey(value), this.getValue(value));
    });

    const newResults = new Map<string, DiffValueType>();
    newData.forEach((data) => {
      const key = this.getKey(data);
      const value = this.getValue(data);
      newResults.set(key, value);

      const oldValue = oldResults.get(key) || this.emptyValue;
      const newValue = value || this.emptyValue;
      if (oldValue !== newValue) {
        diffs.set(key, {
          oldValue,
          newValue,
        });
      }
    });

    oldResults.forEach((value, key) => {
      const oldValue = value || this.emptyValue;
      const newValue = newResults.get(key) || this.emptyValue;
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

  abstract getKey(result: DataRecord): string;

  abstract getValue(result: DataRecord): DiffValueType;
}
