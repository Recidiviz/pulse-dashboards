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
  verbose = false,
): boolean {
  const seenValuesByKey = new Map<string, Set<unknown>>();

  if (objects.length <= 1) return false;

  for (const obj of objects) {
    if (obj === null) continue;
    for (const [key, value] of Object.entries(obj)) {
      if (!seenValuesByKey.has(key)) seenValuesByKey.set(key, new Set());
      const keyStatus = seenValuesByKey.get(key);
      if (keyStatus) keyStatus.add(value);
    }
  }

  /**
   * Key-value pairs where all values are the same across all objects.
   */
  const badPairs = Array.from(seenValuesByKey.entries()).reduce(
    (acc, [key, uniqueValues]) => {
      if (!excludedKeys?.includes(key) && uniqueValues.size === 1)
        acc.push({ [key]: uniqueValues.values().next().value });
      return acc;
    },
    [] as unknown[],
  );

  if (badPairs.length > 0 && verbose)
    console.warn(
      `WARNING: All values are the same for non-excluded key(s): `,
      badPairs,
    );

  return badPairs.length === 0;
}
