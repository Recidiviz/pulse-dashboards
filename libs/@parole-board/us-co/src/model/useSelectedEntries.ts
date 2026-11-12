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

import { useCallback, useState } from "react";

type SelectionState = {
  monthKey: string;
  presentIds: readonly string[];
  ids: readonly string[];
};

/**
 * The selected entry ids for one month, in the order they were selected.
 * Any number of entries can be selected, across any days.
 *
 * Toggling an id that isn't in presentIds does nothing. selectOnly makes one
 * entry the whole selection, as after adding it.
 *
 * Changing monthKey clears the selection. When presentIds changes, as after a
 * refetch, ids no longer in it are dropped for good, so an entry that comes
 * back later doesn't come back selected.
 *
 * Args:
 *   monthKey: Identifies the month shown, such as "2026-09".
 *   presentIds: The ids of the month's entries. Pass a memoized array: a new
 *     array on every render costs an extra render each time.
 */
export function useSelectedEntries(
  monthKey: string,
  presentIds: readonly string[],
) {
  const [state, setState] = useState<SelectionState>({
    monthKey,
    presentIds,
    ids: [],
  });

  // Adjusts the state during render rather than in an effect, so the stale
  // selection never reaches the screen.
  let current = state;
  if (state.monthKey !== monthKey || state.presentIds !== presentIds) {
    const present = new Set(presentIds);
    const kept =
      state.monthKey === monthKey
        ? state.ids.filter((id) => present.has(id))
        : [];
    current = {
      monthKey,
      presentIds,
      // Keep the same array when nothing was dropped, so consumers that
      // memoize on the selection don't recompute.
      ids: kept.length === state.ids.length ? state.ids : kept,
    };
    setState(current);
  }

  const toggle = useCallback((entryId: string) => {
    setState((prev) => {
      if (prev.ids.includes(entryId)) {
        return { ...prev, ids: prev.ids.filter((id) => id !== entryId) };
      }
      if (!prev.presentIds.includes(entryId)) return prev;
      return { ...prev, ids: [...prev.ids, entryId] };
    });
  }, []);

  // Unlike toggle, this takes an id that isn't in presentIds yet, such as an
  // entry just added whose updated month hasn't rendered yet. The next
  // presentIds change keeps it once it's there, or drops it if it never is.
  const selectOnly = useCallback((entryId: string) => {
    setState((prev) => ({ ...prev, ids: [entryId] }));
  }, []);

  const clear = useCallback(() => {
    setState((prev) => (prev.ids.length === 0 ? prev : { ...prev, ids: [] }));
  }, []);

  return { selectedIds: current.ids, toggle, selectOnly, clear };
}
