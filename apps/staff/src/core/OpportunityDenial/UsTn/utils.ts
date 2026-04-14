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
  const wrapped = charLimitedNote(comment, TOMIS_MAX_LINE_LENGTH);
  const pages = paginatedTEPENoteByLine(wrapped, TOMIS_MAX_LINES_PER_PAGE);
  return Object.fromEntries(pages.map((page, i) => [i + 1, page]));
}

/**
 * Converts a JS Date to the string format produced by Python's
 * `datetime.isoformat()`. The backend uses this format in Firestore
 * document paths for contact note status tracking.
 *
 * JS toISOString():     "2026-04-13T21:30:00.123Z"
 * Python isoformat():   "2026-04-13T21:30:00.123000+00:00"
 *
 * When milliseconds are zero, Python omits the fractional part entirely:
 * JS: "2026-04-13T21:30:00.000Z" → Python: "2026-04-13T21:30:00+00:00"
 */
export function toPythonIsoformat(date: Date): string {
  const iso = date.toISOString();
  const match = iso.match(/^(.+)\.(\d{3})Z$/);
  if (!match) throw new Error(`Unexpected ISO format: ${iso}`);
  const [, prefix, ms] = match;
  if (ms === "000") {
    return `${prefix}+00:00`;
  }
  return `${prefix}.${ms}000+00:00`;
}

/**
 * Returns the Firestore document ID that the backend uses for non-TEPE
 * contact note status tracking (denial codes, REIO).
 * Must match `UsTnContactNoteStatusTracker._firestore_path()` in
 * `recidiviz-data/recidiviz/case_triage/workflows/writeback/us_tn_contact_note.py`.
 */
export function contactNoteFirestoreDocId(contactNoteDateTime: Date): string {
  return `usTnContactNote_${toPythonIsoformat(contactNoteDateTime)}`;
}

export function buildContactNoteRequestBody(
  opportunity: Opportunity,
  staffId: string,
  contactTypeCodes: string[],
  comment: string,
  contactNoteDateTime?: string,
): Record<string, unknown> {
  return {
    stateCode: "US_TN",
    personExternalId: opportunity.person.externalId,
    personExternalIdType: "US_TN_DOC",
    staffId,
    staffIdType: "US_TN_STAFF_TOMIS",
    contactNoteDateTime: contactNoteDateTime ?? new Date().toISOString(),
    contactTypeCodes,
    contactNote: chunkCommentToContactNote(comment),
  };
}
