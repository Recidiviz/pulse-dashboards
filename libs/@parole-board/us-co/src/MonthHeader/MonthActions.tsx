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

import { ReactNode, useState } from "react";

import type { MonthDetail } from "~@parole-board/common";
import { ParoleBoardButton } from "~@parole-board/common";
import { PageActionsSkeleton } from "~@parole-board/common/loading";

import { EditPublishedMonthModal } from "../EditMonthModal/EditPublishedMonthModal";
import {
  canEditMonth,
  canEditPublishedMonth,
  formatMonthYear,
} from "../model/month";
import { useCurrentYearMonth } from "../model/useCurrentYearMonth";
import { PUBLISH_COPY } from "../PublishMonthModal/copy";
import { PublishMonthModal } from "../PublishMonthModal/PublishMonthModal";

export type MonthActionsProps = {
  /** True until the viewed month first loads. */
  pending: boolean;
  /**
   * The viewed month, null when it doesn't exist yet, and undefined while it
   * loads or when it failed to load.
   */
  month?: MonthDetail | null;
  /** Actions shown before Review & Publish, such as "+ Add hearing". */
  children?: ReactNode;
};

/**
 * The header's page actions for the viewed month. While the month loads
 * they're placeholders the size of the buttons they stand for, so the header
 * doesn't shift when they arrive. Actions passed as children, such as
 * "+ Add hearing" for a draft, come first. Review & Publish shows on the
 * months whose entries can change, a DRAFT from the current month on, and
 * opens the publish dialog. A PUBLISHED month from the current month on is
 * locked, and its only action is Edit month, which opens the dialog that
 * moves it back to draft. The view keys it by month, so moving to another
 * month, as with the browser's Back button, closes any open dialog and
 * starts it afresh.
 */
export function MonthActions({ pending, month, children }: MonthActionsProps) {
  const current = useCurrentYearMonth();
  const canPublish = month && canEditMonth(month, current);
  const canEdit = month && canEditPublishedMonth(month, current);
  const [publishOpen, setPublishOpen] = useState(false);
  const [editOpen, setEditOpen] = useState(false);

  if (pending) return <PageActionsSkeleton />;

  return (
    <>
      {children}
      {/* One button for both actions, so when a publish or an Edit month
          flips the month's status, React keeps the same button and the
          closing dialog can return focus to it. */}
      {month && (canPublish || canEdit) && (
        <ParoleBoardButton
          kind="primary"
          // Starts with the visible text, so speech input users can say
          // what they see (WCAG 2.5.3, Label in Name).
          aria-label={
            canEdit ? `Edit month: ${formatMonthYear(month)}` : undefined
          }
          onClick={() => (canEdit ? setEditOpen(true) : setPublishOpen(true))}
        >
          {canEdit ? "Edit month" : PUBLISH_COPY.opener}
        </ParoleBoardButton>
      )}
      {/* The dialogs render for any month, not only one whose button shows,
          so a publish or an Edit month that changes the month's status
          doesn't unmount its dialog before it toasts and closes. */}
      {month && (
        <>
          <PublishMonthModal
            isOpen={publishOpen}
            month={month}
            onClose={() => setPublishOpen(false)}
          />
          <EditPublishedMonthModal
            isOpen={editOpen}
            month={month}
            onClose={() => setEditOpen(false)}
          />
        </>
      )}
    </>
  );
}
