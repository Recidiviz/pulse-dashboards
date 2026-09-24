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

import { spacing } from "@recidiviz/design-system";
import { subYears } from "date-fns";
import { rem } from "polished";
import { useMemo, useState } from "react";
import styled from "styled-components";

import { ParoleCaseNote } from "~datatypes";
import { palette } from "~design-system";

import {
  CaseNote,
  CaseNoteModal,
  NoteBody,
  NoteDate,
  NoteMeta,
  NoteRow,
  NotesList,
  Source,
} from "../../../CaseNotes";
import { Pagination } from "../../../Pagination/Pagination";
import {
  formatDateLong,
  parseIsoDate,
  SubsectionCaption,
  SubsectionTitle,
} from "../shared";
import { UsIdCaseNotesFilter } from "./UsIdCaseNotesFilter";

/** How many notes one page of the list holds. */
export const US_ID_NOTES_PER_PAGE = 10;

/**
 * How far back the list reaches. Anything older is dropped here rather than
 * relied on from the backend, so the caption's promise holds whatever the
 * backend sends -- the same approach the sibling DOR subsection takes.
 */
export const US_ID_CASE_NOTE_YEARS = 3;

const Subsection = styled.div`
  display: flex;
  flex-direction: column;
  gap: ${rem(spacing.lg)};
`;

const SubsectionHeader = styled.div`
  display: flex;
  align-items: flex-start;
  justify-content: space-between;
  gap: ${rem(spacing.md)};

  ${SubsectionCaption} {
    margin-bottom: 0;
  }
`;

const NotesFrame = styled.div`
  border: 1px solid ${palette.slate20};
  border-radius: ${rem(4)};
`;

/** How many lines of a note the row preview shows before it clips. */
const NOTE_PREVIEW_LINES = 3;

/**
 * Clips the preview to NOTE_PREVIEW_LINES, so it matches the box it is drawn
 * in at any column width and reflows when that width changes. The full text
 * is one click away in CaseNoteModal.
 */
const ClampedNoteBody = styled(NoteBody)`
  display: -webkit-box;
  -webkit-box-orient: vertical;
  -webkit-line-clamp: ${NOTE_PREVIEW_LINES};
  overflow: hidden;
`;

/**
 * Turns a wire case note into the shape the shared note list renders. The
 * type is whatever Idaho's source system calls it -- "Parole Board Note",
 * "Supervision Notes" -- so it is shown as sent, never mapped to a code.
 *
 * @param note - One case note from the parole case record.
 */
function toCaseNote(note: ParoleCaseNote): CaseNote {
  return {
    id: note.id,
    source: note.type,
    date: parseIsoDate(note.date),
    body: note.body,
  };
}

/**
 * US_ID's Case Notes subsection. Lists the notes newest first, ten to a
 * page; each row opens the full text in a modal, since Idaho's notes average
 * a few hundred characters and run into the thousands.
 *
 * @param caseNotes - The case's notes, absent until the backend sends them.
 */
export function UsIdCaseNotesSection({
  caseNotes,
}: {
  caseNotes?: Array<ParoleCaseNote>;
}) {
  const [currentPage, setCurrentPage] = useState(0);
  const [selectedTypes, setSelectedTypes] = useState<Set<string>>();
  const [selectedNote, setSelectedNote] = useState<CaseNote | undefined>(
    undefined,
  );

  const notes = useMemo(() => {
    // A count of calendar years, not a duration: subYears lands on the same
    // day N years back, so a note can't drift across the boundary as leap
    // days accumulate.
    const cutoff = subYears(new Date(), US_ID_CASE_NOTE_YEARS);
    return (caseNotes ?? [])
      .map(toCaseNote)
      .filter((note) => note.date >= cutoff)
      .sort((a, b) => b.date.getTime() - a.date.getTime());
  }, [caseNotes]);

  const noteTypes = useMemo(
    () => [...new Set(notes.map((note) => note.source))].sort(),
    [notes],
  );

  const countsByType = useMemo(() => {
    const counts = new Map<string, number>();
    for (const note of notes) {
      counts.set(note.source, (counts.get(note.source) ?? 0) + 1);
    }
    return counts;
  }, [notes]);

  // Undefined means no filter yet, which shows everything -- the types are
  // derived from the notes, so there is no full set to seed state with.
  const visibleNotes = useMemo(
    () =>
      selectedTypes
        ? notes.filter((note) => selectedTypes.has(note.source))
        : notes,
    [notes, selectedTypes],
  );

  const totalPages = Math.ceil(visibleNotes.length / US_ID_NOTES_PER_PAGE);
  const pageStart = currentPage * US_ID_NOTES_PER_PAGE;
  const pageNotes = visibleNotes.slice(
    pageStart,
    pageStart + US_ID_NOTES_PER_PAGE,
  );

  // Any filter change can leave the reader past the end of a shorter list.
  function applyTypes(types: Set<string> | undefined) {
    setSelectedTypes(types);
    setCurrentPage(0);
  }

  function toggleType(type: string) {
    const next = new Set(selectedTypes ?? noteTypes);
    if (next.has(type)) next.delete(type);
    else next.add(type);
    applyTypes(next);
  }

  return (
    <Subsection>
      <SubsectionHeader>
        <div>
          <SubsectionTitle>Case Notes</SubsectionTitle>
          <SubsectionCaption>
            {notes.length === 0
              ? `No case notes in the last ${US_ID_CASE_NOTE_YEARS} years`
              : `Showing case notes from the last ${US_ID_CASE_NOTE_YEARS} years`}
          </SubsectionCaption>
        </div>
        {noteTypes.length > 1 && (
          <UsIdCaseNotesFilter
            types={noteTypes}
            selectedTypes={new Set(selectedTypes ?? noteTypes)}
            countsByType={countsByType}
            onToggleType={toggleType}
            onSelectOnlyType={(type) => applyTypes(new Set([type]))}
            onSelectAllTypes={() => applyTypes(undefined)}
            onClearAllTypes={() => applyTypes(new Set())}
          />
        )}
      </SubsectionHeader>
      {notes.length > 0 && visibleNotes.length === 0 && (
        <SubsectionCaption>
          No case notes match the selected filters
        </SubsectionCaption>
      )}
      {visibleNotes.length > 0 && (
        <>
          <NotesFrame data-testid="us-id-case-notes-list">
            <NotesList>
              {pageNotes.map((note) => (
                <NoteRow key={note.id} onClick={() => setSelectedNote(note)}>
                  <NoteMeta>
                    <Source>{note.source}</Source>
                    <NoteDate>{formatDateLong(note.date)}</NoteDate>
                  </NoteMeta>
                  <ClampedNoteBody>{note.body}</ClampedNoteBody>
                </NoteRow>
              ))}
            </NotesList>
          </NotesFrame>
          <Pagination
            currentPage={currentPage}
            totalPages={totalPages}
            onPageChange={setCurrentPage}
            summary={`${pageStart + 1}-${pageStart + pageNotes.length} of ${
              visibleNotes.length
            }`}
          />
        </>
      )}

      <CaseNoteModal
        isOpen={selectedNote !== undefined}
        note={selectedNote}
        onRequestClose={() => setSelectedNote(undefined)}
      />
    </Subsection>
  );
}
