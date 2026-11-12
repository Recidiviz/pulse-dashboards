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

import { useRef, useState } from "react";

import type {
  CalendarWeekday,
  EntryDto,
  MonthDetail,
} from "~@parole-board/common";

import { isAllowedDay } from "../model/isAllowedDay";
import {
  alreadyOnByDay,
  type useMoveEntryFlow,
} from "../model/useMoveEntryFlow";
import type { MoveEntryModalProps } from "./MoveEntryModal";

type MoveEntryFlow = ReturnType<typeof useMoveEntryFlow>;

/**
 * Runs the "Move to…" dialog for the selected entries. Opening it records
 * each entry as it is then, version included, and the move sends those
 * versions even if a refetch changes the entries while the dialog is open,
 * so the server rejects a move of an entry the editor hasn't seen (Spec D).
 *
 * - Success closes the dialog and calls onMoved with the day once it has
 *   closed, after the dialog has returned focus to "Move to…". The entries
 *   stay selected, so the action bar follows them.
 * - A move that would share a slot, or that the server refused because the
 *   editor's copy of the month is stale, closes it; useMoveEntryFlow has
 *   already toasted why.
 * - Any other failure rejects onMove, so the dialog stays open with the
 *   error and the editor can try again.
 *
 * The dialog can't close while the move runs, so its outcome always lands.
 *
 * Args:
 *   month: The month shown, with its entries.
 *   selected: The selected entries, in the order they were selected.
 *   allowedWeekdays: The calendar's allowed weekdays from config.get; the
 *     dialog disables every other day.
 *   flow: useMoveEntryFlow for the month.
 *   onMoved: Called with the day, "YYYY-MM-DD", once the entries are on it
 *     and the dialog has closed.
 *
 * Returns open, which opens the dialog for selected, and the dialog's props.
 */
export function useMoveToDialog({
  month,
  selected,
  allowedWeekdays,
  flow,
  onMoved,
}: {
  month: MonthDetail;
  selected: readonly EntryDto[];
  allowedWeekdays: readonly CalendarWeekday[];
  flow: MoveEntryFlow;
  onMoved: (date: string) => void;
}): { open: () => void; modalProps: MoveEntryModalProps } {
  const [isOpen, setIsOpen] = useState(false);
  // Kept after the dialog closes, so its contents don't change while it goes.
  const [targets, setTargets] = useState<readonly EntryDto[]>([]);
  // The day the entries moved to, until the dialog has finished closing.
  const movedTo = useRef<string | null>(null);

  const dates = new Set(targets.map(({ date }) => date));

  return {
    open: () => {
      if (selected.length === 0 || flow.moving) return;
      setTargets([...selected]);
      setIsOpen(true);
    },
    modalProps: {
      isOpen,
      month,
      labels: targets.map(({ label }) => label),
      currentDate: dates.size === 1 ? targets[0].date : null,
      isDisabled: (date) => !isAllowedDay(date, allowedWeekdays),
      alreadyOn: alreadyOnByDay(month.entries, targets),
      onCancel: () => setIsOpen(false),
      onMove: async (date) => {
        const outcome = await flow.move(targets, date, "move_to");
        if (outcome.status === "moved") movedTo.current = date;
        setIsOpen(false);
      },
      onAfterClose: () => {
        const date = movedTo.current;
        if (date === null) return;
        movedTo.current = null;
        onMoved(date);
      },
    },
  };
}
