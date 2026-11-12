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
import { useState } from "react";
import styled from "styled-components";

import { semantics } from "~@parole-board/common";
import { september2026 } from "~@parole-board/common/fixtures";

import { ActionBar } from "../ActionBar/ActionBar";
import { CancelToggle } from "./CancelToggle";
import { EntryActions } from "./EntryActions";

function fixtureEntry(
  id: string,
  entries: typeof september2026.entries = september2026.entries,
) {
  const entry = entries.find((e) => e.id === id);
  if (!entry) throw new Error(`No fixture entry ${id}`);
  return entry;
}

// The grey band the action bar sits in on the Public Calendar screen.
const Band = styled.div`
  display: flex;
  justify-content: flex-end;
  padding: ${rem(semantics.space.md)};
  background: ${semantics.surface.muted};
`;

// The action bar with the entry selected, as the Public Calendar screen shows
// it. It opens and closes the question like useEntryDelete and flips Cancel
// and Undo like the container does, so the example can be clicked through.
// Delete, Cancel and Undo send no request.
function SelectedEntry({
  id,
  canDelete,
  canCancel = false,
  entries,
  submitting = false,
}: {
  id: string;
  canDelete: boolean;
  canCancel?: boolean;
  entries?: typeof september2026.entries;
  submitting?: boolean;
}) {
  const entry = fixtureEntry(id, entries);
  const { label, date } = entry;
  const [confirming, setConfirming] = useState(false);
  const [cancelled, setCancelled] = useState(entry.cancelled);
  return (
    <Band>
      <ActionBar selected={[{ label, date }]}>
        <EntryActions
          label={label}
          date={date}
          canDelete={canDelete}
          confirming={confirming}
          deleting={false}
          onDeleteRequest={() => setConfirming(true)}
          onDeleteConfirm={() => setConfirming(false)}
          onDeleteCancel={() => setConfirming(false)}
        >
          <CancelToggle
            label={label}
            date={date}
            cancelled={cancelled}
            canCancel={canCancel}
            submitting={submitting}
            onCancel={() => setCancelled(true)}
            onUndo={() => setCancelled(false)}
          />
        </EntryActions>
      </ActionBar>
    </Band>
  );
}

const FULL_BOARD = "2026-09-11:FULL_BOARD:Full Board";
const BUSINESS_MEETING = "2026-09-25:BUSINESS_MEETING:Business Meeting";

/** The month with the Business Meeting on the 25th cancelled too. */
const entriesWithCancelledBusinessMeeting = september2026.entries.map((e) =>
  e.id === BUSINESS_MEETING ? { ...e, cancelled: true } : e,
);

export default {};

// Hearings can't be cancelled, so the bar has only Delete.
export const HearingSelected = () => (
  <SelectedEntry id="2026-09-14:HEARING:FCF" canDelete />
);

export const FullBoardSelected = () => (
  <SelectedEntry id={FULL_BOARD} canDelete canCancel />
);

// A cancelled Full Board meeting can still be deleted, so the bar keeps
// Delete next to Undo.
export const CancelledFullBoardSelected = () => (
  <SelectedEntry
    id={FULL_BOARD}
    canDelete
    canCancel
    entries={september2026.entriesWithCancelledMeeting}
  />
);

// Business Meetings can only be cancelled, so the bar has no Delete.
export const BusinessMeetingSelected = () => (
  <SelectedEntry id={BUSINESS_MEETING} canDelete={false} canCancel />
);

export const CancelledBusinessMeetingSelected = () => (
  <SelectedEntry
    id={BUSINESS_MEETING}
    canDelete={false}
    canCancel
    entries={entriesWithCancelledBusinessMeeting}
  />
);

export const CancellingFullBoard = () => (
  <SelectedEntry id={FULL_BOARD} canDelete canCancel submitting />
);
