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

// Parsing what Typesense sends back. Both bulk endpoints answer in NDJSON — one
// JSON object per line, not a JSON array — so neither can be consumed with a
// plain JSON.parse.
//
// Both are lenient with a malformed line, but they fail in opposite directions
// and that is deliberate:
//
//   parseImportResponse — a bad line becomes a counted FAILURE, so a garbled
//     response can never inflate the imported count.
//   selectStaleIds      — a bad line is SKIPPED, so it can never become a
//     delete candidate. Unparseable means "don't touch it", not "remove it".

import type { ImportEntry } from "./types";

// Typesense v1.x's bulk-import response is either a pre-parsed array (modern)
// or an NDJSON string (older). Normalize both shapes into `ImportEntry[]`.
export function parseImportResponse(raw: unknown): ImportEntry[] {
  if (Array.isArray(raw)) return raw as ImportEntry[];
  return String(raw)
    .split("\n")
    .filter(Boolean)
    .map((line): ImportEntry => {
      try {
        return JSON.parse(line) as ImportEntry;
      } catch {
        return {
          success: false,
          error: `unparseable response line: ${line}`,
        };
      }
    });
}

// Given a Typesense id-only export (JSONL, one `{"id":"..."}` per line) and the
// set of ids that Firestore says should exist, returns the ids present in
// Typesense but NOT in Firestore — the docs to delete. Lines that are blank,
// unparseable, or missing a string `id` are skipped rather than aborting the
// diff. Pure and deterministic so the prune decision is unit-testable without a
// live cluster.
export function selectStaleIds(
  exportedJsonl: string,
  keepIds: Set<string>,
): string[] {
  const stale: string[] = [];
  for (const line of exportedJsonl.split("\n")) {
    if (!line) continue;
    try {
      const { id } = JSON.parse(line) as { id?: unknown };
      if (typeof id === "string" && !keepIds.has(id)) stale.push(id);
    } catch {
      // Ignore an unparseable export line rather than abort the whole prune.
    }
  }
  return stale;
}
