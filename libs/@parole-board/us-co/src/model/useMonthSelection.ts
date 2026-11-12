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

import { useMemo } from "react";

import type {
  EntryDto,
  MonthDetail,
  YearMonthOption,
} from "~@parole-board/common";

import { toYearMonthParam } from "./month";
import { useSelectedEntries } from "./useSelectedEntries";
import { useStableList } from "./useStableList";

// A missing or read-only month offers no entries to select.
const NO_ENTRIES: readonly EntryDto[] = [];
const NO_IDS: readonly string[] = [];

/**
 * The month's entry selection, which the grid, the action bar and the Add
 * hearing dialog share: the selected ids in the order they were selected,
 * the selected entries, and toggle, selectOnly and clear. Changing month
 * clears it, and a refetch that drops a selected entry drops it from the
 * selection. A month that isn't editable,
 * or doesn't exist, has nothing to select, so a refetch that finds the month
 * published clears the selection.
 */
export function useMonthSelection(
  viewed: YearMonthOption,
  month: MonthDetail | null,
  editable: boolean,
) {
  const entries = month?.entries ?? NO_ENTRIES;
  // Stable across refetches that keep the same entries, so the selection
  // isn't rechecked on each one.
  const ids = useMemo(() => entries.map((entry) => entry.id), [entries]);
  const presentIds = useStableList(ids);
  const { selectedIds, toggle, selectOnly, clear } = useSelectedEntries(
    toYearMonthParam(viewed),
    editable ? presentIds : NO_IDS,
  );
  const selected = useMemo(() => {
    const byId = new Map(entries.map((entry) => [entry.id, entry]));
    return selectedIds.flatMap((id) => byId.get(id) ?? []);
  }, [entries, selectedIds]);

  return { selectedIds, selected, toggle, selectOnly, clear };
}

export type MonthSelection = ReturnType<typeof useMonthSelection>;
