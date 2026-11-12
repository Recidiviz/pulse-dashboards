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

import { useState } from "react";

/**
 * Returns the previous list while items holds the same items in the same
 * order, so memos and effects downstream don't rerun.
 *
 * A month's refetch needs this: React Query keeps unchanged data's references
 * only for plain objects and arrays, and every entry carries Date fields, so
 * each refetch returns new entry objects even when nothing changed.
 *
 * Args:
 *   items: The latest list.
 *   isEqual: Whether two items are the same. Defaults to Object.is.
 */
export function useStableList<List extends readonly unknown[]>(
  items: List,
  isEqual: (a: List[number], b: List[number]) => boolean = Object.is,
): List {
  const [stable, setStable] = useState(items);
  if (stable === items) return stable;
  const same =
    stable.length === items.length &&
    stable.every((item, index) => isEqual(item, items[index]));
  if (same) return stable;
  // Adjusts the state during render rather than in an effect, so the new
  // list renders straight away.
  setStable(items);
  return items;
}
