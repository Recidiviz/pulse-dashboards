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

import { RefObject, useId, useMemo, useRef } from "react";

import {
  ModalActionRow,
  ModalError,
  ParoleBoardButton,
  useRestoreFocusAfterSubmit,
} from "~@parole-board/common";

import { PUBLISH_COPY } from "./copy";
import { PublishConfirm } from "./PublishConfirm";
import { PublishSummary, PublishSummaryProps } from "./PublishSummary";

export interface PublishMonthReviewProps extends PublishSummaryProps {
  /** Whether the confirm checkbox is ticked. Publishing waits for it. */
  confirmed: boolean;
  onConfirmedChange: (confirmed: boolean) => void;
  /** True while the publish is in flight. */
  submitting?: boolean;
  /** The server's message, or publishFailedMessage for any other failure. */
  error?: string | null;
  /**
   * Replaces the checkbox, "Cancel" and the publish button with a single
   * "Close", for an error that publishing again can't fix: the month is
   * already published, or no longer exists.
   */
  closeOnly?: boolean;
  /** The dialog's element, from PublishMonthDialog's dialogRef. */
  dialogRef: RefObject<HTMLDivElement | null>;
  onCancel: () => void;
  onPublish: () => void;
}

/**
 * The publish dialog's body: the counts and holiday warnings, the
 * confirm checkbox, an inline error and the buttons. The publish button
 * stays disabled until the checkbox is ticked, and only a press on it
 * publishes: there's no form, so Enter on the checkbox doesn't. It renders
 * from props only; its container loads the publish preview, holds the
 * checkbox and sends the publish. Matches the publish modal in the Calendar
 * Unit Dashboard design, inside the standard ~design-system Modal.
 *
 * While the publish runs, focus stays on the dialog. When it fails and the
 * dialog stays open, focus returns to the publish button, or to the checkbox
 * or "Close" when the button can't be pressed.
 */
export function PublishMonthReview({
  counts,
  holidayWarnings,
  confirmed,
  onConfirmedChange,
  submitting = false,
  error,
  closeOnly = false,
  dialogRef,
  onCancel,
  onPublish,
}: PublishMonthReviewProps) {
  const errorId = useId();
  const panelRef = useRef<HTMLDivElement>(null);
  const publishRef = useRef<HTMLButtonElement>(null);
  const closeRef = useRef<HTMLButtonElement>(null);
  // The ~design-system Checkbox takes no ref, so the checkbox is found in
  // its panel.
  const checkboxRef = useMemo<RefObject<HTMLInputElement | null>>(
    () => ({
      get current() {
        return panelRef.current?.querySelector("input") ?? null;
      },
    }),
    [],
  );

  useRestoreFocusAfterSubmit(submitting, {
    hold: dialogRef,
    restore: [publishRef, checkboxRef, closeRef],
  });

  return (
    <>
      <PublishSummary counts={counts} holidayWarnings={holidayWarnings} />

      {!closeOnly && (
        <PublishConfirm
          label={PUBLISH_COPY.confirm}
          confirmed={confirmed}
          onConfirmedChange={onConfirmedChange}
          disabled={submitting}
          panelRef={panelRef}
        />
      )}

      {error && <ModalError id={errorId}>{error}</ModalError>}

      <ModalActionRow>
        {closeOnly ? (
          <ParoleBoardButton
            ref={closeRef}
            kind="secondary"
            onClick={onCancel}
            aria-describedby={error ? errorId : undefined}
          >
            Close
          </ParoleBoardButton>
        ) : (
          <>
            <ParoleBoardButton
              kind="secondary"
              onClick={onCancel}
              disabled={submitting}
            >
              Cancel
            </ParoleBoardButton>
            <ParoleBoardButton
              ref={publishRef}
              kind="primary"
              onClick={onPublish}
              disabled={!confirmed}
              waiting={submitting}
              aria-describedby={error ? errorId : undefined}
            >
              {PUBLISH_COPY.action}
            </ParoleBoardButton>
          </>
        )}
      </ModalActionRow>
    </>
  );
}
