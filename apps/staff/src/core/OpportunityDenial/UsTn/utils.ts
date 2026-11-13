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

import { Opportunity } from "../../../WorkflowsStore";
import {
  charLimitedNote,
  paginatedTEPENoteByLine,
} from "../../Paperwork/US_TN/Expiration/TEPENote";

export const TOMIS_COMMENT_MIN_CHARS = 3;
export const TOMIS_COMMENT_MAX_CHARS = 1600;
const TOMIS_MAX_LINE_LENGTH = 70;
const TOMIS_MAX_LINES_PER_PAGE = 10;

// TOMIS can reject non-ASCII characters. Keep in sync with
// _TOMIS_ASCII_REPLACEMENTS in recidiviz-data us_tn_contact_note.py.
const TOMIS_ASCII_REPLACEMENTS: Record<string, string> = {
  "\u2022": "-", // bullet
  "\u25cf": "-", // black circle
  "\u25aa": "-", // small black square
  "\u2013": "-", // en dash
  "\u2014": "-", // em dash
  "\u2018": "'",
  "\u2019": "'",
  "\u201c": '"',
  "\u201d": '"',
  "\u00a0": " ", // non-breaking space
};
const TOMIS_ASCII_REPLACEMENT_PATTERN = new RegExp(
  `[${Object.keys(TOMIS_ASCII_REPLACEMENTS).join("")}]`,
  "g",
);
// eslint-disable-next-line no-control-regex
const NON_ASCII_PATTERN = /[^\x00-\x7f]/g;

/**
 * Returns text with common punctuation mapped to ASCII, accents stripped from
 * letters, and any other non-ASCII character removed.
 */
export function toTomisAscii(text: string): string {
  return text
    .replace(
      TOMIS_ASCII_REPLACEMENT_PATTERN,
      (char) => TOMIS_ASCII_REPLACEMENTS[char],
    )
    .normalize("NFD")
    .replace(NON_ASCII_PATTERN, "");
}

/**
 * Chunks a comment string into paginated contact note format expected by
 * the TOMIS InsertContactNote API: { 1: ["line1", ...], 2: ["line1", ...] }
 *
 * Lines are wrapped at 70 characters on word boundaries.
 * Pages contain at most 10 lines each.
 */
export function chunkCommentToContactNote(
  comment: string,
): Record<number, string[]> {
  const wrapped = charLimitedNote(
    toTomisAscii(comment).trim(),
    TOMIS_MAX_LINE_LENGTH,
  );
  const pages = paginatedTEPENoteByLine(wrapped, TOMIS_MAX_LINES_PER_PAGE);
  return Object.fromEntries(pages.map((page, i) => [i + 1, page]));
}

/**
 * Returns a Firestore-safe identifier for one TOMIS writeback attempt.
 */
export function generateContactNoteId(): string {
  return crypto.randomUUID();
}

/**
 * Returns the opportunity update document ID that the backend uses for non-TEPE
 * contact note status tracking (denial codes, REIO). This keeps the writeback
 * history on the opportunity update instead of a separate contact-note doc.
 * Must match `UsTnContactNoteStatusTracker._firestore_path()` in
 * `recidiviz-data/recidiviz/case_triage/workflows/writeback/us_tn_contact_note.py`.
 */
export function contactNoteFirestoreDocId(opportunity: Opportunity): string {
  return opportunity.firestoreUpdateDocId;
}

export function buildContactNoteRequestBody(
  opportunity: Opportunity,
  staffId: string,
  contactTypeCodes: string[],
  comment: string,
  contactNoteId: string,
  contactNoteDateTime?: string,
): Record<string, unknown> {
  return {
    stateCode: "US_TN",
    personExternalId: opportunity.person.externalId,
    personExternalIdType: "US_TN_DOC",
    staffId,
    staffIdType: "US_TN_STAFF_TOMIS",
    contactNoteDateTime: contactNoteDateTime ?? new Date().toISOString(),
    contactNoteId,
    contactTypeCodes,
    contactNote: chunkCommentToContactNote(comment),
  };
}
