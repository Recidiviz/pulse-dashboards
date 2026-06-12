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
  /** SOURCE label, e.g. "MOSAGI - OFFICE VISIT". */
  source: string;
  date: Date;
  /** Full note text; `\n` paragraphs are preserved when rendered in the modal. */
  body: string;
};

/**
 * Stub fixture matching the Figma's "Recent Case Notes" content. The first two
 * bodies are intentionally long enough that the 2-line clamp on the card row
 * visibly truncates; the modal expands them in full.
 */
const STUB_NOTES: RecentCaseNote[] = [
  {
    id: "stub-1",
    source: "SOURCE PLACEHOLDER",
    date: new Date("2026-04-15"),
    body: "Home visit conducted — Charlie present at residence. Apartment clean and stable. No violations observed. Neighbor interactions reported as positive. Discussed ongoing employment search and reviewed transportation logistics for upcoming court date. Charlie expressed continued interest in vocational training opportunities; provided referral packet for the local workforce development office.",
  },
  {
    id: "stub-2",
    source: "SOURCE",
    date: new Date("2024-06-12"),
    body: "Charlie attended scheduled office meeting. Reported maintaining sobriety and steady employment. No compliance issues. Discussed upcoming housing transition plans, reviewed budgeting worksheet, and confirmed attendance at this month's support group. Reminded Charlie of the next required check-in and provided updated contact information for the assigned case manager.",
  },
  {
    id: "stub-3",
    source: "SOURCE",
    date: new Date("2026-03-30"),
    body: "He brought his sister in to meet me today as she is home for the summer, she is going to run the Food Truck that they are opening which is going to have Puerto Rican and Mexican Food, they are anticipating to open June 1st, they are currently doing the paperwork.",
  },
];

/**
 * Returns the most recent case notes for the given client.
 *
 * Currently returns a hard-coded stub so the UI can ship behind the
 * `recentCaseNotes` feature variant; the `client` argument is reserved for the
 * real backend wiring (likely a tRPC query against ARB) and is not yet read.
 */
export function useRecentCaseNotes(client: Client): {
  notes: RecentCaseNote[];
  isLoading: boolean;
} {
  // `client` is part of the forward-compatible signature; the stub doesn't
  // read it yet. The real implementation will key the data fetch off it.
  void client;
  // TODO(OBT-32327): replace with real data source (likely tRPC against ARB).
  return { notes: STUB_NOTES.slice(0, MAX_RECENT_NOTES), isLoading: false };
}
