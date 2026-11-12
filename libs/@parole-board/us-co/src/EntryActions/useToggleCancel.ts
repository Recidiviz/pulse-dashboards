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
import toast from "react-hot-toast";

import type { EntryDto } from "~@parole-board/common";
import {
  getCalendarErrorCode,
  getCalendarErrorMessage,
  useCancelEntry,
  useUncancelEntry,
} from "~@parole-board/common";

import { formatMonthDay } from "../model/month";
import type { CancelToggleProps } from "./CancelToggle";

/** The toast's id, so a second cancel or undo replaces the first one's toast. */
export const CANCEL_TOAST_ID = "pb-calendar-entry-cancel";

/** The CancelToggle props that run the cancel and undo. */
export type ToggleCancelProps = Pick<
  CancelToggleProps,
  "cancelled" | "canCancel" | "submitting" | "onCancel" | "onUndo"
>;

/**
 * Runs "Cancel" and "Undo" for the selected Full Board or Business Meeting
 * through entries.cancel and entries.uncancel. They're separate requests, so
 * a retried one can't undo itself (Spec D). Each sends the entry's
 * version as it was on the click, so the server rejects a change to an entry
 * the editor hasn't seen. Neither changes the selection.
 *
 * On success useCancelEntry and useUncancelEntry store the month the server
 * returned before the request resolves, and a failure that means the
 * editor's copy is stale (STALE_CALENDAR_CODES), or an unknown one, refetches
 * the month first, so when the outcome below runs the button already reads
 * its new label and the grid shows the server's state.
 *
 * - Success toasts "Cancelled Full Board on September 11" or "Full Board on
 *   September 11 is back on".
 * - Any failure toasts the server's message, such as CONFLICT's, or a
 *   generic one when the server's isn't written for editors. The request
 *   can be tried again from the button.
 * - PRECONDITION_FAILED means the month was published, as from another tab,
 *   and is locked. After its toast, "September 2026 is published.
 *   Click Edit month to change it.", onMonthLocked runs, because the
 *   refetched month is read-only and the button is about to go away.
 *
 * Whether the entry can be cancelled comes from its kind's cancellable flag
 * in the calendar API, never from a list of kind codes.
 *
 * Args:
 *   selected: The one selected entry, or null with none or several selected.
 *   onMonthLocked: Called after PRECONDITION_FAILED's toast, since the month
 *     is now locked: it should clear the selection and move focus to the
 *     month's title, as the button is about to go away.
 *
 * Returns the CancelToggle props for selected, or null when it's null.
 */
export function useToggleCancel(
  selected: EntryDto | null,
  onMonthLocked: () => void,
): ToggleCancelProps | null {
  const cancelEntry = useCancelEntry();
  const uncancelEntry = useUncancelEntry();
  // The entry the running request is for, so only its button waits.
  const [targetId, setTargetId] = useState<string | null>(null);
  const pending = cancelEntry.isPending || uncancelEntry.isPending;

  if (!selected) return null;

  const run = (cancel: boolean) => {
    if (pending) return;
    const { id: entryId, version: expectedVersion, label, date } = selected;
    const day = formatMonthDay(date);
    setTargetId(entryId);
    // mutateAsync rather than mutate's callbacks, which React Query skips
    // once the calling component has unmounted.
    const request = cancel
      ? cancelEntry.mutateAsync({ entryId, expectedVersion })
      : uncancelEntry.mutateAsync({ entryId, expectedVersion });
    request.then(
      () =>
        toast(
          cancel
            ? `Cancelled ${label} on ${day}`
            : `${label} on ${day} is back on`,
          { id: CANCEL_TOAST_ID },
        ),
      (error: unknown) => {
        toast.error(getCalendarErrorMessage(error), { id: CANCEL_TOAST_ID });
        if (getCalendarErrorCode(error) === "PRECONDITION_FAILED") {
          onMonthLocked();
        }
      },
    );
  };

  return {
    canCancel: selected.kind.cancellable,
    cancelled: selected.cancelled,
    submitting: pending && targetId === selected.id,
    onCancel: () => run(true),
    onUndo: () => run(false),
  };
}
