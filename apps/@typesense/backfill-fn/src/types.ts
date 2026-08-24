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

// Shared shapes for the backfill.
//
// CollectionConfig and the doc-id / merge shapes it nests come from the
// COLLECTIONS_JSON env var, so they are also the contract the Terraform
// component writes against — see the typesense-backfill component's
// `collections` variable.

import type { firestore } from "firebase-admin";
import type { Client as TypesenseClient } from "typesense";

import type { RateLimiter } from "./throttle";

// ---------------------------------------------------------------------------
// 1. Caller-declared configuration
// ---------------------------------------------------------------------------

export type CollectionConfig = {
  /**
   * Typesense target collection. Several configs may share one target (every
   * per-state opportunity source → `opportunities`).
   */
  name: string;
  /**
   * Firestore source collection. Defaults to `name`. Set when several
   * Firestore collections feed a single Typesense target.
   */
  sourceCollection?: string;
  fields: string[];
  /**
   * Constants stamped onto every emitted doc from this source AFTER the
   * source-field projection (so a constant with the same key as a source
   * field wins). Used to inject discriminators — `system` on the caseload/
   * person collections, `sourceCollection` on per-source opportunity feeds —
   * that either don't exist on the source doc or should be canonicalized.
   * `id` is protected; a `constantFields.id` entry cannot clobber the docId.
   */
  constantFields?: Record<string, string>;
  /**
   * Per-doc derivations. Two variants, both discriminated by their key set:
   *
   * 1. **Value-map**: read `data[from]`, look it up in `valueMapping`, stamp
   *    the mapped value into `into`. Used for `locations.system` derived
   *    from `idType`. Source values not in `valueMapping` leave the target
   *    unset (under-permissive default).
   * 2. **Conditional copy**: if `data[when.field] === when.equals`, copy the
   *    value of `data[copyFrom]` into `into`. Used for `locations.district`
   *    on district-idType docs, where the district name already lives in
   *    `locationId` and just needs to be surfaced under the `district` key
   *    the byDistricts filter references.
   *
   * Applied BEFORE `constantFields` so an explicit constant still wins on
   * key collision. `id` is protected regardless — always set from `docId`
   * last, so neither variant can clobber it.
   */
  derivedFields?: Array<
    | { from: string; into: string; valueMapping: Record<string, string> }
    | {
        copyFrom: string;
        into: string;
        when: { field: string; equals: string };
      }
  >;
  /**
   * How to compose the Typesense doc id. Omit to use the Firestore doc id
   * unchanged. A field-composed id is already unique across sources, so it
   * takes no prefix.
   */
  docIdOverrides?: DocIdPrefixOverride | DocIdFieldsOverride;
  /**
   * Additional Firestore collections whose fields are merged onto documents
   * this config emits, keyed by document path (see `mergeDocIdFromPath`).
   *
   * This is what lets user-written updates live ON the record they update
   * instead of in a parallel Typesense collection — Typesense has no joins, so
   * a separate collection would force every query to fan out and merge
   * client-side. It also makes the backfill authoritative for the whole
   * document, so a re-run repairs anything sync-fn missed.
   */
  mergeSources?: MergeSource[];
};

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
 * yields `us_tn_123_usTnExpiration` — exactly what sync-fn composes from the
 * update's Firestore path, so both writers land on one document.
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

export type MergeSource = {
  /** Firestore collection (or collection-group) holding the merge documents. */
  sourceCollection: string;
  /**
   * Query as a collection group rather than a root collection. Required for
   * subcollections — `clientOpportunityUpdates` exists once per person.
   */
  collectionGroup?: boolean;
  /** Fields copied from the merge document. Anything else is dropped. */
  fields: string[];
};

// ---------------------------------------------------------------------------
// 2. Per-run context
// ---------------------------------------------------------------------------

/**
 * Everything fixed for the whole invocation, assembled once by runBackfill.
 *
 * `limiter` MUST be the same instance everywhere: it bounds the combined request
 * rate across concurrently running collections, so a per-collection limiter
 * would silently multiply the rate by the concurrency.
 */
export type RunContext = {
  db: firestore.Firestore;
  client: TypesenseClient;
  limiter: RateLimiter;
  /** Firestore page size, which is also the Typesense import batch size. */
  batchSize: number;
  prune: boolean;
  stateCode?: string;
};

// ---------------------------------------------------------------------------
// 3. Results and wire shapes
// ---------------------------------------------------------------------------

export type BackfillResult = {
  name: string;
  pages: number;
  imported: number;
  failed: number;
  // Stale Typesense docs deleted because their id was absent from Firestore.
  deleted: number;
};

export type BackfillSummary = {
  collections: BackfillResult[];
  totals: { imported: number; failed: number; deleted: number };
};

export type FirestoreDoc = Record<string, unknown>;

// Per-doc result line from Typesense's bulk import.
export type ImportEntry =
  | { success: true }
  | { success: false; error?: string };

// Shape Typesense's client throws when EVERY doc in the bulk fails. The error
// object carries the same per-line results that a success response returns.
export type TypesenseImportError = Error & {
  httpStatus?: number;
  importResults?: ImportEntry[];
};
