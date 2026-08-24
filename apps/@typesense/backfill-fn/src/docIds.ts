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

// Every rule for naming a Typesense document, in one file.
//
// This grouping is deliberate. A Typesense doc id is an AGREEMENT between
// writers that never call each other:
//
//   - backfill-fn's import pass and its prune confirming scan, both through
//     toTypesenseId
//   - backfill-fn's merge-source loading, through mergeDocIdFromPath, to address
//     the documents sync-fn wrote
//   - sync-fn itself, which does NOT import this file — `resolveTarget` in
//     apps/@typesense/sync-fn/src/sync.ts composes the id inline from the
//     document path. It agrees with mergeDocIdFromPath on both paths that exist
//     today, but nothing enforces that; the two drift silently if either moves.
//
// All of them must land on one document or the writers fork: the update
// decorates a doc nobody searches, or the prune deletes a doc it cannot match.

import type { CollectionConfig, FirestoreDoc } from "./types";

// Composes the Typesense doc id from document fields. Absent, empty or
// non-string values are skipped rather than emitting a bare `_`, so an
// opportunity without an `opportunityId` yields `us_tn_123_usTnExpiration`
// while one with it yields `us_tn_123_usTnExpiration_span2`. Returns undefined
// when nothing usable was found, so callers can fall back to the Firestore id.
export function composeDocIdFromFields(
  data: Record<string, unknown>,
  docIdFields: string[],
  lowercaseFields: string[] = [],
): string | undefined {
  const lower = new Set(lowercaseFields);
  const parts: string[] = [];
  for (const field of docIdFields) {
    const value = data[field];
    if (typeof value !== "string" || value === "") continue;
    parts.push(lower.has(field) ? value.toLowerCase() : value);
  }
  return parts.length > 0 ? parts.join("_") : undefined;
}

// Composes the Typesense doc id for one source document. Three shapes:
//   - no override      → the Firestore doc id, unchanged
//   - type "prefix"    → `<prefix>_<firestoreId>`
//   - type "fields"    → composed from document FIELDS, falling back to the
//                        Firestore id for a malformed doc carrying none of them
//                        (the ETL shouldn't emit one)
//
// Shared by the import pass and the prune's confirming scan (see scanSourceIds
// in prune.ts) so both derive ids through exactly one definition. That sharing
// is load-bearing, not tidiness: the confirming scan decides what the prune
// deletes by comparing against ids the import produced, so a second definition
// that drifted would confirm nothing and the prune would delete live documents.
export function toTypesenseId(
  fsId: string,
  data: FirestoreDoc,
  docIdOverrides: CollectionConfig["docIdOverrides"],
): string {
  if (docIdOverrides?.type === "fields") {
    return (
      composeDocIdFromFields(
        data,
        docIdOverrides.fields,
        docIdOverrides.lowercaseFields,
      ) ?? fsId
    );
  }
  return docIdOverrides ? `${docIdOverrides.prefix}_${fsId}` : fsId;
}

// Derives the target doc id from a merge document's Firestore path by taking
// the document-id segments (the odd ones) and joining them with `_`:
//
//   clientUpdatesV2/us_tn_123                                  → us_tn_123
//   clientUpdatesV2/us_tn_123/clientOpportunityUpdates/usTnLSU → us_tn_123_usTnLSU
export function mergeDocIdFromPath(path: string): string {
  const segments = path.split("/");
  return segments.filter((_, i) => i % 2 === 1).join("_");
}
