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

import { useEffect, useRef } from "react";
import styled from "styled-components";

import { ParoleBoardButton, semantics } from "~@parole-board/common";

import { formatMonthDay } from "../model/month";

const { border, radius, stroke } = semantics;

// Holds focus while the waiting button is disabled, so focus doesn't drop to
// the page. A keyboard user sees the focus ring around the waiting button,
// drawn as the DS Checkbox and Radio draw theirs.
const FocusHolder = styled.span`
  display: inline-flex;
  border-radius: ${radius.pill};

  &:focus {
    outline: none;
  }

  &:focus-visible {
    outline: ${stroke.focus} solid ${border.focus};
    outline-offset: ${stroke.focusOffset};
  }
`;

export interface CancelToggleProps {
  /** The meeting's name as the grid shows it, such as "Full Board". */
  label: string;
  /** The meeting's day, as YYYY-MM-DD. */
  date: string;
  /** True when the meeting is cancelled, which turns "Cancel" into "Undo". */
  cancelled: boolean;
  /**
   * The kind's cancellable flag. False for hearings, which render nothing
   * because they can only be deleted.
   */
  canCancel: boolean;
  /**
   * True while the cancel or undo request runs. Flip cancelled no later than
   * this turns false, so focus returns to the button with its new label;
   * screen readers don't announce a label that changes under focus.
   */
  submitting: boolean;
  /** Called by "Cancel". */
  onCancel(): void;
  /** Called by "Undo". */
  onUndo(): void;
}

/**
 * The "Cancel" and "Undo" button for a selected Full Board or Business
 * Meeting, shown in the action bar before "Delete hearing", as in the Public
 * Calendar screen of the Calendar Unit Dashboard design. Both labels use the
 * design's red, and "Cancel" turns into "Undo" right away, with no
 * confirmation.
 *
 * Render it in EntryActions' children. The button disables itself while
 * waiting, so after a click focus moves to a holder around it and returns to
 * the button, which by then reads the other label, when the request ends.
 */
export function CancelToggle({
  label,
  date,
  cancelled,
  canCancel,
  submitting,
  onCancel,
  onUndo,
}: CancelToggleProps) {
  const holderRef = useRef<HTMLSpanElement>(null);
  const buttonRef = useRef<HTMLButtonElement>(null);
  const clicked = useRef(false);

  useEffect(() => {
    if (!clicked.current) return;
    // Leave focus alone if the editor moved it elsewhere.
    const active = document.activeElement;
    if (submitting) {
      if (active === buttonRef.current || active === document.body) {
        holderRef.current?.focus();
      } else {
        clicked.current = false;
      }
      return;
    }
    clicked.current = false;
    if (active === holderRef.current || active === document.body) {
      buttonRef.current?.focus();
    }
  }, [submitting]);

  if (!canCancel) return null;

  const day = formatMonthDay(date);

  const handleClick = () => {
    clicked.current = true;
    if (cancelled) {
      onUndo();
    } else {
      onCancel();
    }
  };

  return (
    <FocusHolder ref={holderRef} tabIndex={-1}>
      <ParoleBoardButton
        kind="destructive"
        ref={buttonRef}
        waiting={submitting}
        aria-label={
          cancelled
            ? `Undo the cancellation of ${label} on ${day}`
            : `Cancel ${label} on ${day}`
        }
        onClick={handleClick}
      >
        {cancelled ? "Undo" : "Cancel"}
      </ParoleBoardButton>
    </FocusHolder>
  );
}
