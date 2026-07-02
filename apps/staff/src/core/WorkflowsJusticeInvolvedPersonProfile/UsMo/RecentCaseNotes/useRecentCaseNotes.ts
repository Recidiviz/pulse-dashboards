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

import { UsMoClientMetadata } from "~datatypes";

import { Client } from "../../../../WorkflowsStore";

/**
 * Maximum number of notes returned by `useRecentCaseNotes`. The card and its
 * subtitle ("3 most recent case notes…") both assume this cap; exposed so the
 * test suite can assert it without duplicating the literal.
 */
export const MAX_RECENT_NOTES = 3;

/**
 * A single recent case note, as rendered in the US_MO "Recent Case Notes" card
 * and its detail modal. Shape is intentionally distinct from the
 * search-snippet-oriented `CaseNoteSearchResults` in `CaseNoteSearch.tsx`.
 */
export type RecentCaseNote = {
  /** Stable React key + dialog selector. */
  id: string;
  /** SOURCE label — the contact type(s), e.g. "POV, UA". */
  source: string;
  date: Date;
  /** Full note text; `\n` paragraphs are preserved when rendered in the modal. */
  body: string;
};

type SupervisionContact = NonNullable<
  UsMoClientMetadata["supervisionContacts"]
>[number];

/**
 * Maps a single raw `supervisionContacts` entry to a `RecentCaseNote`. Returns
 * `undefined` for contacts missing the date or note we need to render a usable
 * row — the metadata feed is intentionally sparse (every field is nullish), so
 * we drop unrenderable entries rather than show blanks.
 */
function toRecentCaseNote(
  contact: SupervisionContact,
  index: number,
): RecentCaseNote | undefined {
  const { contactDate, contactNote, contactTypes } = contact;
  if (!contactDate || !contactNote) return undefined;

  return {
    // `contactDate` alone isn't unique (a client can have multiple contacts on
    // one day), so pair it with the source index for a stable, unique key.
    id: `${contactDate.toISOString()}-${index}`,
    source: contactTypes?.join(", ") ?? "",
    date: contactDate,
    body: contactNote,
  };
}

/**
 * Returns the most recent case notes for the given client.
 *
 * Reads from the US_MO client's `metadata.supervisionContacts` (sourced from
 * the ARB feed), keeping the most recent `MAX_RECENT_NOTES` contacts. Because
 * metadata travels with the client record, the data is available synchronously
 * and `isLoading` is always `false`.
 */
export function useRecentCaseNotes(client: Client): {
  notes: RecentCaseNote[];
  isLoading: boolean;
} {
  const { supervisionContacts } = client.metadata as UsMoClientMetadata;

  const notes = (supervisionContacts ?? [])
    .map(toRecentCaseNote)
    .filter((note): note is RecentCaseNote => note !== undefined)
    .sort((a, b) => b.date.getTime() - a.date.getTime())
    .slice(0, MAX_RECENT_NOTES);

  return { notes, isLoading: false };
}
