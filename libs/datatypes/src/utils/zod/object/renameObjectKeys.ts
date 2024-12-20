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

import { mapKeys } from "lodash";

/**
 * Renames all occurrences of the keys in `obj` that are present as a key in `oldToNewKeyMapping`.
 * @param obj The object to be renamed.
 * @param oldToNewKeyMapping Mapping of keys to be renamed. The keys of this object are the old keys, and the values are the new keys.
 * @returns The object with the renamed keys.
 */
export function renameObjectKeys<
  T extends object,
  M extends Partial<Record<keyof T, string>>,
>(oldToNewKeyMapping: M) {
  return function (obj: T) {
    return mapKeys(
      obj,
      (_, k) => oldToNewKeyMapping[k as keyof T] ?? k,
    ) as Omit<T, keyof M>;
  };
}
