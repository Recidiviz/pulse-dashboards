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

// How a Typesense document is named.
//
// This lives in the shared lib because a doc id is an AGREEMENT between two
// separately deployed Cloud Functions that never call each other: backfill-fn
// keys documents from the Firestore source, sync-fn keys them from the Firestore
// write path when an officer makes a change.
//
// Both must land on one document, and divergence fails silently — the update
// decorates a record nobody searches, or the backfill's prune deletes a record
// it can no longer match. Importing from here is what makes that a compile-time
// guarantee.

/** An untyped Firestore document body, as `doc.data()` returns it. */
export type FirestoreDoc = Record<string, unknown>;

/**
 * Prepend a constant to the Firestore doc id. Required for multi-source targets
 * so docs with the same Firestore id across sources don't collide (e.g. one
 * person's `compliantReporting` and `LSU` opportunity records both key
 * `<state>_<externalId>`).
 */
export type DocIdPrefixOverride = {
  type: "prefix";
  prefix: string;
};

/**
 * Compose the doc id from document FIELDS rather than the Firestore doc id,
 * joining the values with `_` and skipping absent ones.
 *
 * Needed wherever a second writer has to address the same document without
 * seeing the Firestore doc id. `opportunities` uses
 * `["stateCode", "externalId", "opportunityType", "opportunityId"]`, which
 * yields `us_tn_123_usTnExpiration` — the same id sync-fn derives from the
 * update's Firestore path via mergeDocIdFromPath, so both writers land on one
 * document.
 *
 * Composing from FIELDS rather than the doc id matters for multi-instance
 * opportunities: the ETL keys those `us_or_1234_<opportunityId>`, but
 * `externalId` on the document is always the person's external id, so the
 * field-composed key stays aligned with the person record id either way.
 */
export type DocIdFieldsOverride = {
  type: "fields";
  fields: string[];
  /**
   * Fields to lowercase before joining. `stateCode` is stored uppercase
   * (`US_TN`) but person record ids are lowercase (`us_tn_123`), and the id has
   * to match the record-id convention for sync-fn to reach it.
   */
  lowercaseFields?: string[];
};

export type DocIdOverrides = DocIdPrefixOverride | DocIdFieldsOverride;

// Composes the Typesense doc id from document fields. Absent, empty or
// non-string values are skipped rather than emitting a bare `_`, so an
// opportunity without an `opportunityId` yields `us_tn_123_usTnExpiration`
// while one with it yields `us_tn_123_usTnExpiration_span2`. Returns undefined
// when nothing usable was found, so callers can fall back to the Firestore id.
export function composeDocIdFromFields(
  data: FirestoreDoc,
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
// backfill-fn calls this from both its import pass and its prune's confirming
// scan. The confirming scan decides what the prune deletes by comparing against
// ids the import produced, so those two MUST derive ids identically — hence one
// function rather than two call sites doing their own composition.
export function toTypesenseId(
  fsId: string,
  data: FirestoreDoc,
  docIdOverrides: DocIdOverrides | undefined,
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

// Derives the target doc id from an update document's Firestore path by taking
// the document-id segments (the odd ones) and joining them with `_`:
//
//   clientUpdatesV2/us_tn_123                                  → us_tn_123
//   clientUpdatesV2/us_tn_123/clientOpportunityUpdates/usTnLSU → us_tn_123_usTnLSU
//
// Both writers call this — sync-fn when an officer writes, backfill-fn when it
// merges those writes onto the ETL record — so the two agree by construction.
export function mergeDocIdFromPath(path: string): string {
  const segments = path.split("/");
  return segments.filter((_, i) => i % 2 === 1).join("_");
}
