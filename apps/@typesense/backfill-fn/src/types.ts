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
// CollectionConfig is deserialized from the COLLECTIONS_JSON env var, so it is
// also the contract the Terraform component writes against — see the
// typesense-backfill component's `collections` variable. The doc-id shapes it
// nests live in ~@typesense/client, because sync-fn keys the same documents.

import type { firestore } from "firebase-admin";
import type { Client as TypesenseClient } from "typesense";

import type {
  DocIdFieldsOverride,
  DocIdOverrides,
  DocumentSystem,
  FirestoreDoc,
} from "~@typesense/client";

import type { RateLimiter } from "./throttle";
import type { Transform } from "./transforms";
import type { TransformName } from "./transforms";

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
  /**
   * Scan the source as a collection GROUP rather than a root collection.
   *
   * Needs no Firestore index, though it looks like it should: the automatic
   * single-field indexes cover collection-group scope and already carry
   * `__name__` as their tiebreaker. A composite group query would need one.
   */
  collectionGroup?: boolean;
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
  docIdOverrides?: DocIdOverrides;
  /**
   * Typesense reference fields whose value is COMPOSED from fields on the
   * source document, by the same rules `docIdOverrides` uses. This is how a
   * child document names the parent it joins to.
   *
   * Applied before `constantFields`; `id` stays protected. A composition that
   * yields nothing leaves the field unset, which for an optional reference
   * dangles — join filters exclude it, so it fails closed.
   */
  referenceFields?: Array<{
    into: string;
    fields: string[];
    lowercaseFields?: string[];
  }>;
  /**
   * A named per-document derivation, applied after `referenceFields` and
   * before `constantFields`. Named rather than a function because this config
   * is deserialized from COLLECTIONS_JSON, which can only carry JSON.
   *
   * Only for real logic: `derivedFields` covers a lookup or a guarded copy.
   */
  transform?: TransformName;
  /**
   * Additional Firestore collections whose fields are merged onto documents
   * this config emits, keyed by document path — see `mergeDocIdFromPath` in
   * ~@typesense/client, which sync-fn calls to write them.
   *
   * Two uses, differing in which document is read:
   *
   * 1. **User-written updates onto the record they update.** Keyed by the
   *    target's own id, so a re-run repairs anything sync-fn missed.
   * 2. **Person scope onto the records it governs.** Keyed by `lookupKey`, so
   *    one person's record decorates every opportunity that person has.
   */
  mergeSources?: MergeSource[];
};

export type MergeSource = {
  /** Firestore collection (or collection-group) holding the merge documents. */
  sourceCollection: string;
  /**
   * Query as a collection group rather than a root collection. Required for
   * subcollections — `clientOpportunityUpdates` exists once per person.
   */
  collectionGroup?: boolean;
  /**
   * Fields copied from the merge document. Anything else is dropped.
   *
   * - `"officerId"` copies across under the same name.
   * - `{ from, into }` RENAMES on the way across: a client's `district` and a
   *   resident's `facilityId` both land in `locationId`.
   * - `{ value, into }` stamps a LITERAL, but only when this source matched.
   */
  fields: Array<
    string | { from: string; into: string } | { value: string; into: string }
  >;
  /**
   * Restricts this source to runs for one system. An untagged source applies
   * to every run.
   */
  system?: DocumentSystem;
  /**
   * Compose the merge LOOKUP key from the TARGET document's own fields instead
   * of the target's id, so one merge document can decorate many targets.
   *
   * It must equal the merge document's own key — its Firestore path with the
   * collection segments dropped. For `clients/us_tn_123` that is `us_tn_123`,
   * which is what `["stateCode", "externalId"]` composes from an opportunity.
   */
  lookupKey?: DocIdFieldsOverride;
  /**
   * Whether merge documents carry `stateCode`, so a state-scoped run can push
   * the filter into Firestore instead of discarding after the read.
   * See loadMergeDocuments.
   */
  hasStateCode?: boolean;
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

/** One merge source's documents, keyed the way that source finds its target. */
export type MergeSet = { source: MergeSource; docs: Map<string, FirestoreDoc> };

export type Projection = Pick<
  CollectionConfig,
  "fields" | "constantFields" | "derivedFields" | "referenceFields"
> & {
  /** Already resolved, so an unknown name fails the run rather than a document. */
  transform?: Transform;
};
