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
import { ReactNode, useEffect, useRef } from "react";
import styled from "styled-components";

import { ParoleBoardButton, semantics } from "~@parole-board/common";

import { moveFocusWithArrows } from "../ActionBar/moveFocusWithArrows";
import { DeleteEntryConfirm } from "../DeleteEntryConfirm";
import { formatMonthDay } from "../model/month";

const { space } = semantics;

const Actions = styled.div`
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  justify-content: flex-end;
  gap: ${rem(space.sm)};
`;

export interface EntryActionsProps {
  /** The selected entry's name as the grid shows it, such as "FCF". */
  label: string;
  /** The selected entry's day, as YYYY-MM-DD. */
  date: string;
  /** False for entries that can only be cancelled, such as Business Meetings. */
  canDelete: boolean;
  /** True while the delete question is open in place of the buttons. */
  confirming: boolean;
  /** True while the delete request runs. */
  deleting: boolean;
  /** A message to show with the question when the delete failed. */
  deleteError?: string;
  /** Called by "Delete hearing" to open the question. */
  onDeleteRequest(): void;
  /** Called by the question's "Delete". */
  onDeleteConfirm(): void;
  /** Called by the question's "Cancel" and by Escape. */
  onDeleteCancel(): void;
  /**
   * Actions shown before "Delete hearing", such as "Move to…" and a meeting's
   * "Cancel". They're hidden while the delete question is open.
   */
  children?: ReactNode;
}

/**
 * The buttons for the one selected entry, in the action bar above the
 * calendar. "Delete hearing" opens an inline question in place of the
 * buttons. Whenever confirming turns false while this stays mounted, focus
 * returns to "Delete hearing". After a successful delete the container
 * clears the selection, which removes this component, and moves focus to the
 * month title itself.
 */
export function EntryActions({
  label,
  date,
  canDelete,
  confirming,
  deleting,
  deleteError,
  onDeleteRequest,
  onDeleteConfirm,
  onDeleteCancel,
  children,
}: EntryActionsProps) {
  const deleteRef = useRef<HTMLButtonElement>(null);
  const wasConfirming = useRef(confirming);

  useEffect(() => {
    if (wasConfirming.current && !confirming) {
      deleteRef.current?.focus();
    }
    wasConfirming.current = confirming;
  }, [confirming]);

  if (confirming && canDelete) {
    return (
      <DeleteEntryConfirm
        label={label}
        date={date}
        deleting={deleting}
        error={deleteError}
        onConfirm={onDeleteConfirm}
        onCancel={onDeleteCancel}
      />
    );
  }

  return (
    <Actions onKeyDown={moveFocusWithArrows}>
      {children}
      {canDelete && (
        <ParoleBoardButton
          kind="destructive"
          ref={deleteRef}
          aria-label={`Delete hearing: ${label} on ${formatMonthDay(date)}`}
          onClick={onDeleteRequest}
        >
          Delete hearing
        </ParoleBoardButton>
      )}
    </Actions>
  );
}
