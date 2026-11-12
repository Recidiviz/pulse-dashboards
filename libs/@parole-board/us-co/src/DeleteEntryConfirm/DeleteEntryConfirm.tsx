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

import { rem } from "polished";
import { KeyboardEvent, useEffect, useId, useRef } from "react";
import styled from "styled-components";

import { ParoleBoardButton, semantics } from "~@parole-board/common";

import { moveFocusWithArrows } from "../ActionBar/moveFocusWithArrows";
import { formatMonthDay } from "../model/month";

const { space, status, type } = semantics;

// The action bar right-aligns its contents, so an error that wraps onto its
// own line stays under the buttons.
const Group = styled.div`
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  justify-content: flex-end;
  gap: ${rem(space.sm)};

  /* The group takes focus only to hold it while both buttons are disabled,
     so it draws no focus ring of its own. */
  &:focus {
    outline: none;
  }
`;

// TODO(CO-935): Waiting on ~design-system to export a semibold (600) weight token. Use it for the question once it lands.
const QUESTION_WEIGHT = 600;

const Question = styled.span`
  ${type.Sans14}
  font-weight: ${QUESTION_WEIGHT};
  color: ${status.error};
`;

const ErrorText = styled.p`
  ${type.Sans12}
  flex-basis: 100%;
  margin: 0;
  color: ${status.error};
  text-align: end;
`;

export interface DeleteEntryConfirmProps {
  /** The entry's name as the grid shows it, such as "FCF" or "Full Board". */
  label: string;
  /** The entry's day, as YYYY-MM-DD. */
  date: string;
  /** True while the delete request runs. */
  deleting: boolean;
  /** A message to show under the buttons when the delete failed. */
  error?: string;
  /** Called by "Delete". */
  onConfirm(): void;
  /**
   * Called by "Cancel" and by Escape anywhere in the group, except while
   * deleting.
   */
  onCancel(): void;
}

/**
 * The inline "Delete FCF from September 14?" question that replaces the
 * action bar's buttons after "Delete hearing", as in the Public Calendar
 * screen of the Calendar Unit Dashboard design.
 *
 * Focus starts on "Cancel", so Enter right after opening never deletes.
 * While the request runs, both buttons are disabled and Escape does nothing,
 * because closing the question can't stop a request already sent. Focus
 * moves to the group then, rather than dropping to the page, and returns to
 * "Cancel" if the request fails.
 */
export function DeleteEntryConfirm({
  label,
  date,
  deleting,
  error,
  onConfirm,
  onCancel,
}: DeleteEntryConfirmProps) {
  const questionId = useId();
  const errorId = useId();
  const groupRef = useRef<HTMLDivElement>(null);
  const cancelRef = useRef<HTMLButtonElement>(null);

  useEffect(() => {
    if (deleting) {
      groupRef.current?.focus();
    } else {
      cancelRef.current?.focus();
    }
  }, [deleting]);

  const handleKeyDown = (event: KeyboardEvent<HTMLDivElement>) => {
    moveFocusWithArrows(event);
    if (event.key === "Escape" && !deleting) {
      event.stopPropagation();
      onCancel();
    }
  };

  return (
    <Group
      ref={groupRef}
      role="group"
      tabIndex={-1}
      aria-labelledby={questionId}
      aria-busy={deleting}
      aria-describedby={error ? errorId : undefined}
      onKeyDown={handleKeyDown}
    >
      <Question id={questionId}>
        Delete {label} from {formatMonthDay(date)}?
      </Question>
      <ParoleBoardButton
        kind="secondary"
        ref={cancelRef}
        disabled={deleting}
        onClick={onCancel}
      >
        Cancel
      </ParoleBoardButton>
      <ParoleBoardButton
        kind="destructive"
        waiting={deleting}
        onClick={onConfirm}
      >
        Delete
      </ParoleBoardButton>
      {error && (
        <ErrorText id={errorId} role="alert">
          {error}
        </ErrorText>
      )}
    </Group>
  );
}
