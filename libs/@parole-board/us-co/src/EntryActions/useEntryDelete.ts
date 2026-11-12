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

import { useEffect, useRef, useState } from "react";
import toast from "react-hot-toast";

import type { EntryDto, YearMonthOption } from "~@parole-board/common";
import {
  getCalendarErrorCode,
  getCalendarErrorMessage,
  STALE_CALENDAR_CODES,
  useDeleteEntry,
  useParoleBoardHost,
} from "~@parole-board/common";

import { canDeleteEntry } from "../model/canDeleteEntry";
import { formatMonthDay } from "../model/month";
import type { EntryActionsProps } from "./EntryActions";

/** The toast's id, so a second delete's toast replaces the first one's. */
export const DELETE_TOAST_ID = "pb-calendar-entry-delete";

export const DELETE_FAILED_MESSAGE =
  "We couldn't delete this. Try again or contact Recidiviz support.";

/** The entry as it was when the question opened. */
type DeleteTarget = {
  entryId: string;
  expectedVersion: number;
  label: string;
  date: string;
  kind: string;
};

/** The EntryActions props that run the delete. */
export type EntryDeleteProps = Pick<
  EntryActionsProps,
  | "canDelete"
  | "confirming"
  | "deleting"
  | "deleteError"
  | "onDeleteRequest"
  | "onDeleteConfirm"
  | "onDeleteCancel"
>;

/**
 * Runs "Delete hearing" for the selected entry: the inline question, the
 * entries.delete request and its outcome. Call it from a component that
 * stays mounted while the month is shown. The outcome's toast and analytics
 * event run even if that component unmounts first, as when the editor
 * switches to an empty month while the request runs.
 *
 * The question records the entry's id and version when it opens, and
 * "Delete" sends that version even if a refetch has changed the entry since,
 * so the server rejects a delete of an entry the editor hasn't seen (Spec D).
 * Selecting another entry, or none, closes the question.
 *
 * On success useDeleteEntry stores the month the server returned before the
 * request resolves, and a failure that means the editor's copy is stale
 * (STALE_CALENDAR_CODES) refetches the month first, so when the outcome
 * below runs the grid already shows the server's state.
 *
 * - Success sends trackPbPublicCalendarHearingDeleted, toasts "Deleted FCF
 *   from September 14", clears the selection and moves focus to the month's
 *   title, since the action bar goes away with the selection.
 * - CONFLICT, NOT_FOUND and PRECONDITION_FAILED close the question and toast
 *   the server's message. Focus returns to "Delete hearing", or moves to the
 *   title when the refetch removed the entry. PRECONDITION_FAILED also clears
 *   the selection and moves focus to the title, since the month is locked.
 * - Any other failure keeps the question open with DELETE_FAILED_MESSAGE, so
 *   the editor can try again.
 *
 * Args:
 *   month: The month shown, for the analytics event.
 *   selected: The one selected entry, or null with none or several selected.
 *   clearSelection: Clears the month's selection.
 *   focusTitle: Moves focus to the month's title.
 *
 * Returns the EntryActions props for selected, or null when it's null.
 */
export function useEntryDelete({
  month,
  selected,
  clearSelection,
  focusTitle,
}: {
  month: YearMonthOption;
  selected: EntryDto | null;
  clearSelection: () => void;
  focusTitle: () => void;
}): EntryDeleteProps | null {
  const deleteEntry = useDeleteEntry();
  const { analyticsStore } = useParoleBoardHost();
  const [target, setTarget] = useState<DeleteTarget | null>(null);
  const [failed, setFailed] = useState(false);
  // Read when a request settles, which can be several renders after it
  // started.
  const selectedIdRef = useRef<string | null>(null);
  useEffect(() => {
    selectedIdRef.current = selected?.id ?? null;
  });

  // Closes the question during render rather than in an effect, so it never
  // shows for an entry it wasn't opened for.
  if (target && target.entryId !== selected?.id) {
    setTarget(null);
    setFailed(false);
  }

  if (!selected) return null;

  const confirming = target?.entryId === selected.id;
  const deleting = confirming && deleteEntry.isPending;

  const close = () => {
    setTarget(null);
    setFailed(false);
  };

  const onSuccess = ({ label, date, kind }: DeleteTarget) => {
    analyticsStore.trackPbPublicCalendarHearingDeleted({
      year: month.year,
      month: month.month,
      kind,
    });
    toast(`Deleted ${label} from ${formatMonthDay(date)}`, {
      id: DELETE_TOAST_ID,
    });
    close();
    clearSelection();
    focusTitle();
  };

  const onError = ({ entryId }: DeleteTarget, error: unknown) => {
    const code = getCalendarErrorCode(error);
    if (!code || !STALE_CALENDAR_CODES.has(code)) {
      setFailed(true);
      return;
    }
    close();
    toast.error(getCalendarErrorMessage(error), { id: DELETE_TOAST_ID });
    // The month is locked, so once its refetch renders nothing in it can be
    // selected and the action bar goes away. Clearing the selection now
    // keeps focus from landing on a button that's about to disappear.
    if (code === "PRECONDITION_FAILED") {
      clearSelection();
      focusTitle();
      return;
    }
    // With the entry still selected, EntryActions returns focus to "Delete
    // hearing"; without it, the action bar has gone.
    if (selectedIdRef.current !== entryId) focusTitle();
  };

  const confirm = () => {
    if (!target || deleteEntry.isPending) return;
    const { entryId, expectedVersion } = target;
    setFailed(false);
    // mutateAsync rather than mutate's callbacks, which React Query skips
    // once the calling component has unmounted.
    deleteEntry.mutateAsync({ entryId, expectedVersion }).then(
      () => onSuccess(target),
      (error: unknown) => onError(target, error),
    );
  };

  return {
    canDelete: canDeleteEntry(selected),
    confirming,
    deleting,
    deleteError: confirming && failed ? DELETE_FAILED_MESSAGE : undefined,
    onDeleteRequest: () => {
      if (deleteEntry.isPending) return;
      setFailed(false);
      setTarget({
        entryId: selected.id,
        expectedVersion: selected.version,
        label: selected.label,
        date: selected.date,
        kind: selected.kind.code,
      });
    },
    onDeleteConfirm: confirm,
    onDeleteCancel: () => {
      if (!deleteEntry.isPending) close();
    },
  };
}
