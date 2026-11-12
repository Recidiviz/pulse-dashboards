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

import type { MonthDetail } from "~@parole-board/common";
import {
  editorErrorMessage,
  getCalendarErrorCode,
  getCalendarErrorMessage,
  STALE_CALENDAR_CODES,
  useParoleBoardHost,
  useUnpublishMonth,
} from "~@parole-board/common";

import { formatMonthYear } from "../model/month";
import { editMonthFailedMessage, EditMonthModal } from "./EditMonthModal";

/** The toast's id, so a second Edit month's toast replaces the first one's. */
export const EDIT_MONTH_TOAST_ID = "pb-calendar-month-unpublished";

/** The toast once the month is back in draft. */
export function backInDraftMessage(monthLabel: string) {
  return `${monthLabel} is back in draft and off the public calendar.`;
}

export type EditPublishedMonthModalProps = {
  isOpen: boolean;
  /** The month to edit, as months.get returns it. */
  month: Pick<MonthDetail, "id" | "year" | "month">;
  /** Called when the dialog closes, after the month moves to draft or without it. */
  onClose: () => void;
};

/**
 * Runs "Edit month" on a published month: the confirmation,
 * months.unpublish and its outcome. months.unpublish moves the month back to
 * DRAFT, which takes it off the public calendar and unlocks its entries.
 * useUnpublishMonth stores the month the request returns, so on success the
 * page already shows the month as the server has it, with no refetch.
 *
 * - Success closes the dialog, toasts and sends
 *   trackPbPublicCalendarMonthUnpublished. The page then shows the red DRAFT
 *   strip and "Review & Publish".
 * - A stale month (STALE_CALENDAR_CODES), such as PRECONDITION_FAILED when
 *   another tab already moved it back to draft, closes the dialog and toasts
 *   the server's message, since trying again can't help.
 *   useUnpublishMonth has already refetched the month by then.
 * - Any other failure, network errors included, keeps the dialog open with
 *   the server's message when it was written for editors, and
 *   editMonthFailedMessage otherwise, so the editor can try again.
 */
export function EditPublishedMonthModal({
  isOpen,
  month,
  onClose,
}: EditPublishedMonthModalProps) {
  const monthLabel = formatMonthYear(month);
  const { analyticsStore } = useParoleBoardHost();
  const unpublish = useUnpublishMonth();
  const [error, setError] = useState<string>();

  const close = () => {
    setError(undefined);
    onClose();
  };

  const onConfirm = () => {
    if (unpublish.isPending) return;
    const { year, month: monthNumber } = month;
    setError(undefined);
    // mutateAsync rather than mutate's callbacks, which React Query skips
    // once the calling component has unmounted, as when the editor moves to
    // a month that doesn't exist while the request runs.
    unpublish.mutateAsync({ monthId: month.id }).then(
      () => {
        close();
        toast(backInDraftMessage(monthLabel), { id: EDIT_MONTH_TOAST_ID });
        analyticsStore.trackPbPublicCalendarMonthUnpublished({
          year,
          month: monthNumber,
        });
      },
      (failure: unknown) => {
        const code = getCalendarErrorCode(failure);
        if (code && STALE_CALENDAR_CODES.has(code)) {
          toast.error(getCalendarErrorMessage(failure), {
            id: EDIT_MONTH_TOAST_ID,
          });
          close();
          return;
        }
        setError(
          editorErrorMessage(failure, editMonthFailedMessage(monthLabel)),
        );
      },
    );
  };

  return (
    <EditMonthModal
      isOpen={isOpen}
      monthLabel={monthLabel}
      isUnpublishing={unpublish.isPending}
      error={error}
      onConfirm={onConfirm}
      onCancel={close}
    />
  );
}
