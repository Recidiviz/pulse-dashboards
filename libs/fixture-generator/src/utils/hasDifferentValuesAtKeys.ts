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

/**
 * Checks if a list of non-null objects contains different values for each key across objects,
 * excluding the keys specified in the `excludedKeys` parameter.
 *
 * A "different value" means that at least one object has a value for a key that
 * differs from the value for that key in other objects.
 *
 * Note: This is a simple implementation. It is recommended for use when
 * comparing more than 5 objects in the list to test for differing values at each key.
 */
export function hasDifferentValuesAtKeys(
  objects: object[],
  excludedKeys?: string[],
): boolean {
  const seenValuesByKey = new Map<string, [number, Set<unknown>]>();

  if (objects.length <= 1) return false;

  for (const obj of objects) {
    if (obj === null) continue;
    for (const [key, value] of Object.entries(obj)) {
      if (!seenValuesByKey.has(key)) seenValuesByKey.set(key, [0, new Set()]);
      const keyStatus = seenValuesByKey.get(key);
      if (keyStatus) {
        keyStatus[0]++;
        keyStatus[1].add(value);
      }
    }
  }

  return !Array.from(seenValuesByKey.entries()).some(
    ([key, [count, uniqueValues]]) => {
      return (
        !excludedKeys?.includes(key) && count > 1 && uniqueValues.size === 1
      );
    },
  );
}
