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

import { spacing, typography } from "@recidiviz/design-system";
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
  PAROLE_RECORD_CORNER_RADIUS,
  paroleRecordCardStyles,
  ParoleSubsection,
  ParoleSubsectionCaption,
  ParoleSubsectionHeading,
  ParoleSubsectionTitle,
} from "../ParoleCaseProfileStyles";
import { formatDateLong, parseIsoDate } from "../shared";
import {
  UsIdCaseNotesFilter,
  UsIdCaseNotesFilterGroup,
} from "./UsIdCaseNotesFilter";

/** How many notes one page of the list holds. */
export const US_ID_NOTES_PER_PAGE = 10;

/**
 * How far back the list reaches. Anything older is dropped here rather than
 * relied on from the backend, so the caption's promise holds whatever the
 * backend sends -- the same approach the sibling DOR subsection takes.
 */
export const US_ID_CASE_NOTE_YEARS = 3;

const SubsectionHeader = styled.div`
  display: flex;
  align-items: flex-start;
  justify-content: space-between;
  gap: ${rem(spacing.md)};
`;

const NotesFrame = styled.div`
  ${paroleRecordCardStyles}
  padding: 0;
  background-color: transparent;
  border-radius: ${PAROLE_RECORD_CORNER_RADIUS};
  overflow: hidden;
  border: 0;
  box-shadow: inset 0 0 0 1px ${palette.slate10};
`;

const UsIdNoteRow = styled(NoteRow)`
  position: relative;
  gap: ${rem(spacing.md)};
  padding: ${rem(spacing.md)};
  border-bottom: 0;

  &:not(:last-child)::after {
    content: "";
    position: absolute;
    bottom: 0;
    left: ${rem(spacing.md)};
    right: ${rem(spacing.md)};
    border-bottom: 1px solid ${palette.slate20};
  }

  &:hover,
  &:focus-visible {
    background: transparent;
    border-radius: ${PAROLE_RECORD_CORNER_RADIUS};
    box-shadow: inset 0 0 0 1px ${palette.slate60};
  }

  &:hover::after,
  &:focus-visible::after,
  &:has(+ &:hover)::after,
  &:has(+ &:focus-visible)::after {
    display: none;
  }
`;

const UsIdNoteSource = styled(Source)`
  ${typography.Sans14}
  color: ${palette.slate50};
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

/** Separates the note type from its contact types in a note's label. */
const NOTE_LABEL_SEPARATOR = " - ";

/**
 * A case note plus the two values the filter groups match on. The source is
 * the label shown on the row and in the modal.
 */
type UsIdCaseNote = CaseNote & {
  noteType: string;
  contactTypes: Array<string>;
};

/**
 * Turns a wire case note into the shape the shared note list renders. The
 * types are whatever Idaho's source system calls them -- "Parole Board Note",
 * "Face to Face" -- so they are shown as sent, never mapped to a code. The
 * label reads "Supervision Notes - Face to Face, Phone", or just the note type
 * when the note has no contact type.
 *
 * @param note - One case note from the parole case record.
 */
function toCaseNote(note: ParoleCaseNote): UsIdCaseNote {
  return {
    id: note.id,
    source: [note.type, note.contactTypes.join(", ")]
      .filter(Boolean)
      .join(NOTE_LABEL_SEPARATOR),
    noteType: note.type,
    contactTypes: note.contactTypes,
    date: parseIsoDate(note.date),
    body: note.body,
  };
}

/**
 * Returns each distinct value in display order, with how many notes carry it.
 *
 * @param notes - The notes to tally.
 * @param valuesOf - The values one note carries for the group being tallied.
 */
function tallyValues(
  notes: Array<UsIdCaseNote>,
  valuesOf: (note: UsIdCaseNote) => Array<string>,
) {
  const counts = new Map<string, number>();
  for (const note of notes) {
    for (const value of valuesOf(note)) {
      counts.set(value, (counts.get(value) ?? 0) + 1);
    }
  }
  return {
    values: [...counts.keys()].sort(),
    counts,
  };
}

/**
 * US_ID's Case Notes subsection. Lists the notes newest first, ten to a
 * page; each row opens the full text in a modal, since Idaho's notes average
 * a few hundred characters and run into the thousands.
 *
 * @param caseNotes - The case's notes.
 */
export function UsIdCaseNotesSection({
  caseNotes,
}: {
  caseNotes?: Array<ParoleCaseNote>;
}) {
  const [currentPage, setCurrentPage] = useState(0);
  const [selectedTypes, setSelectedTypes] = useState<Set<string>>();
  const [selectedContactTypes, setSelectedContactTypes] =
    useState<Set<string>>();
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

  const { values: noteTypes, counts: countsByType } = useMemo(
    () => tallyValues(notes, (note) => [note.noteType]),
    [notes],
  );

  const { values: contactTypes, counts: countsByContactType } = useMemo(
    () => tallyValues(notes, (note) => note.contactTypes),
    [notes],
  );

  // The menu hides a group with a single option, and a filter the reader
  // can't see must never hide notes, so a hidden group's selection is ignored.
  const activeTypes = noteTypes.length > 1 ? selectedTypes : undefined;
  const activeContactTypes =
    contactTypes.length > 1 ? selectedContactTypes : undefined;

  // Undefined means no filter yet, which shows everything -- the types are
  // derived from the notes, so there is no full set to seed state with. A note
  // with no contact type has nothing to match on, so the contact type filter
  // never hides it.
  const visibleNotes = useMemo(
    () =>
      notes.filter(
        (note) =>
          (!activeTypes || activeTypes.has(note.noteType)) &&
          (!activeContactTypes ||
            note.contactTypes.length === 0 ||
            note.contactTypes.some((contactType) =>
              activeContactTypes.has(contactType),
            )),
      ),
    [notes, activeTypes, activeContactTypes],
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

  function applyContactTypes(types: Set<string> | undefined) {
    setSelectedContactTypes(types);
    setCurrentPage(0);
  }

  function toggled(
    current: Set<string> | undefined,
    all: Array<string>,
    value: string,
  ) {
    const next = new Set(current ?? all);
    if (next.has(value)) next.delete(value);
    else next.add(value);
    return next;
  }

  const allFilterGroups: Array<UsIdCaseNotesFilterGroup> = [
    {
      title: "Note Type",
      options: noteTypes,
      selectedOptions: new Set(activeTypes ?? noteTypes),
      countsByOption: countsByType,
      onToggleOption: (type) =>
        applyTypes(toggled(activeTypes, noteTypes, type)),
      onSelectOnlyOption: (type) => applyTypes(new Set([type])),
    },
    {
      title: "Contact Type",
      options: contactTypes,
      selectedOptions: new Set(activeContactTypes ?? contactTypes),
      countsByOption: countsByContactType,
      onToggleOption: (type) =>
        applyContactTypes(toggled(activeContactTypes, contactTypes, type)),
      onSelectOnlyOption: (type) => applyContactTypes(new Set([type])),
    },
  ];
  const filterGroups = allFilterGroups.filter(
    ({ options }) => options.length > 1,
  );

  return (
    <ParoleSubsection>
      <SubsectionHeader>
        <ParoleSubsectionHeading>
          <ParoleSubsectionTitle>Case Notes</ParoleSubsectionTitle>
          <ParoleSubsectionCaption>
            {notes.length === 0
              ? `No case notes in the last ${US_ID_CASE_NOTE_YEARS} years`
              : `Showing case notes from the last ${US_ID_CASE_NOTE_YEARS} years`}
          </ParoleSubsectionCaption>
        </ParoleSubsectionHeading>
        {filterGroups.length > 0 && (
          <UsIdCaseNotesFilter
            groups={filterGroups}
            onSelectAll={() => {
              applyTypes(undefined);
              applyContactTypes(undefined);
            }}
            onClearAll={() => {
              applyTypes(new Set());
              applyContactTypes(new Set());
            }}
          />
        )}
      </SubsectionHeader>
      {notes.length > 0 && visibleNotes.length === 0 && (
        <ParoleSubsectionCaption>
          No case notes match the selected filters
        </ParoleSubsectionCaption>
      )}
      {visibleNotes.length > 0 && (
        <>
          <NotesFrame data-testid="us-id-case-notes-list">
            <NotesList>
              {pageNotes.map((note) => (
                <UsIdNoteRow
                  key={note.id}
                  onClick={() => setSelectedNote(note)}
                >
                  <NoteMeta>
                    <UsIdNoteSource>{note.source}</UsIdNoteSource>
                    <NoteDate>{formatDateLong(note.date)}</NoteDate>
                  </NoteMeta>
                  <ClampedNoteBody>{note.body}</ClampedNoteBody>
                </UsIdNoteRow>
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
    </ParoleSubsection>
  );
}
