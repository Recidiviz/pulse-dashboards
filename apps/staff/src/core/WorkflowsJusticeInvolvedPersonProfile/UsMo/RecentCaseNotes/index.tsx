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

import { observer } from "mobx-react-lite";
import { useState } from "react";

import { formatWorkflowsDate } from "../../../../utils";
import { Client } from "../../../../WorkflowsStore";
import {
  CardFrame,
  ModuleEmptyState,
  ModuleHeader,
  ModuleHeading,
} from "../shared/styles";
import { RecentCaseNoteModal } from "./RecentCaseNoteModal";
import {
  CardSubtitle,
  NoteBody,
  NoteDate,
  NoteMeta,
  NoteRow,
  NotesList,
  Source,
} from "./RecentCaseNotes.styled";
import { RecentCaseNote, useRecentCaseNotes } from "./useRecentCaseNotes";

/**
 * Word-count thresholds for the card-row body preview. Notes longer than
 * `TRUNCATE_ABOVE_WORDS` are clipped to the first `TRUNCATED_WORD_COUNT` words
 * with a trailing ellipsis; the full text is always available in the modal.
 */
const TRUNCATE_ABOVE_WORDS = 60;
const TRUNCATED_WORD_COUNT = 50;

/**
 * Returns the note body trimmed to `TRUNCATED_WORD_COUNT` words + an ellipsis
 * when it exceeds `TRUNCATE_ABOVE_WORDS` words; otherwise the body is returned
 * unchanged. Word boundaries are any run of whitespace.
 */
export function truncateNoteBody(body: string): string {
  const words = body.trim().split(/\s+/);
  if (words.length <= TRUNCATE_ABOVE_WORDS) return body;
  return `${words.slice(0, TRUNCATED_WORD_COUNT).join(" ")}…`;
}

type Props = { client: Client };

type ViewProps = { notes: RecentCaseNote[] };

/**
 * Presentation-only card. Takes notes directly so it can be exercised with
 * arbitrary data — by tests, by the local examples renderer, and (today) by
 * the data-bound `RecentCaseNotes` wrapper below.
 */
export const RecentCaseNotesView = function RecentCaseNotesView({
  notes,
}: ViewProps) {
  const [selectedNote, setSelectedNote] = useState<RecentCaseNote | undefined>(
    undefined,
  );

  return (
    <div>
      <ModuleHeader>
        <ModuleHeading>Recent Case Notes</ModuleHeading>
      </ModuleHeader>
      <CardFrame>
        {notes.length === 0 ? (
          <ModuleEmptyState>
            No recent case notes from the past 90 days
          </ModuleEmptyState>
        ) : (
          <>
            <CardSubtitle>
              {notes.length} most recent case notes. Go to ARB to see all.
            </CardSubtitle>
            <NotesList>
              {notes.map((note) => (
                <NoteRow key={note.id} onClick={() => setSelectedNote(note)}>
                  <NoteMeta>
                    <Source>{note.source}</Source>
                    <NoteDate>{formatWorkflowsDate(note.date)}</NoteDate>
                  </NoteMeta>
                  <NoteBody>{truncateNoteBody(note.body)}</NoteBody>
                </NoteRow>
              ))}
            </NotesList>
          </>
        )}
      </CardFrame>
      <RecentCaseNoteModal
        isOpen={selectedNote !== undefined}
        note={selectedNote}
        onRequestClose={() => setSelectedNote(undefined)}
      />
    </div>
  );
};

/**
 * US_MO "Recent Case Notes" card. Lists up to 3 most recent case notes; each
 * row click-opens a `RecentCaseNoteModal` with the full body. The card lives
 * in the right column of the US_MO Workflows client profile, gated by the
 * `recentCaseNotes` feature variant (wired in the parent `FullProfile`).
 */
export const RecentCaseNotes = observer(function RecentCaseNotes({
  client,
}: Props) {
  const { notes } = useRecentCaseNotes(client);
  return <RecentCaseNotesView notes={notes} />;
});

export default RecentCaseNotes;
