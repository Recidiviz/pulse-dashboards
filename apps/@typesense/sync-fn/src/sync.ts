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

// Realtime Firestore→Typesense sync for the two user-written collections.
//
// Updates are merged ONTO the record they update rather than indexed as their
// own collection — Typesense has no joins, so a parallel updates collection
// would force every Workflows query to fan out and merge client-side. That
// makes this a PARTIAL-update writer:
//
//   clientUpdatesV2/{recordId}
//     → patch `preferredName` on `clients`/`residents` doc `{recordId}`
//   clientUpdatesV2/{recordId}/clientOpportunityUpdates/{docId}
//     → patch officer-action fields on `opportunities` doc `{recordId}_{docId}`
//
// Never upsert here: `upsert` replaces the whole document and would wipe the
// ETL-sourced fields that backfill-fn owns. `update` is a PATCH and 404s when
// the target doesn't exist, which is the behavior we want — an update can only
// originate from a user acting on a rendered record, so a 404 means the batch
// side hasn't indexed it yet, and the next backfill reconciles it.
//
// Each trigger owns a disjoint field set. A write that changed none of its
// owned fields is dropped before any Typesense call — see ownedFieldsChanged.
//
// backfill-fn is the authoritative writer: it reconciles these same fields from
// Firestore on every run, so anything this function misses is self-healing.
//
// Everything here is pure and takes the Typesense client as an argument; the
// firebase-functions trigger wiring lives in index.ts.

import type { Client as TypesenseClient } from "typesense";

export const CLIENT_UPDATES_COLLECTION = "clientUpdatesV2";
export const OPPORTUNITY_UPDATES_SUBCOLLECTION = "clientOpportunityUpdates";

// Trigger path patterns. Source of truth for both the firebase-functions
// `document` option and Terraform's match-path-pattern event filter.
export const CLIENT_UPDATE_PATTERN = `${CLIENT_UPDATES_COLLECTION}/{recordId}`;
export const OPPORTUNITY_UPDATE_PATTERN = `${CLIENT_UPDATES_COLLECTION}/{recordId}/${OPPORTUNITY_UPDATES_SUBCOLLECTION}/{opportunityDocId}`;

// A person update could belong to either collection and the path doesn't say
// which. Trying each until one accepts self-routes — `update` never creates, so
// the collection the record isn't in just 404s.
const PERSON_COLLECTIONS = ["clients", "residents"];
const OPPORTUNITIES_COLLECTION = "opportunities";

const PERSON_UPDATE_FIELDS = ["preferredName"];

const OPPORTUNITY_UPDATE_FIELDS = [
  "denial",
  "manualSnooze",
  "autoSnooze",
  "submitted",
  "actionHistory",
];

export type FirestoreDoc = Record<string, unknown>;

export type SyncTarget = {
  // Every collection the patch should be attempted against.
  collections: string[];
  id: string;
  fields: string[];
};

// Splits a Firestore document path into the target collections, doc id and the
// field set this path owns, or null when the path isn't one we sync.
//
// The id is the document-id segments of the path joined with `_`, matching
// backfill-fn's `mergeDocIdFromPath` — that correspondence is what lets the
// batch and realtime writers address the same Typesense document.
export function resolveTarget(path: string): SyncTarget | null {
  const segments = path.split("/");

  if (segments[0] !== CLIENT_UPDATES_COLLECTION) return null;

  if (segments.length === 2) {
    return {
      collections: PERSON_COLLECTIONS,
      id: segments[1],
      fields: PERSON_UPDATE_FIELDS,
    };
  }

  if (
    segments.length === 4 &&
    segments[2] === OPPORTUNITY_UPDATES_SUBCOLLECTION
  ) {
    return {
      collections: [OPPORTUNITIES_COLLECTION],
      id: `${segments[1]}_${segments[3]}`,
      fields: OPPORTUNITY_UPDATE_FIELDS,
    };
  }

  return null;
}

function deepEqual(a: unknown, b: unknown): boolean {
  if (a === b) return true;
  if (
    typeof a !== "object" ||
    typeof b !== "object" ||
    a === null ||
    b === null
  )
    return false;

  if (Array.isArray(a) || Array.isArray(b)) {
    if (!Array.isArray(a) || !Array.isArray(b) || a.length !== b.length)
      return false;
    return a.every((item, index) => deepEqual(item, b[index]));
  }

  const left = a as Record<string, unknown>;
  const right = b as Record<string, unknown>;
  const leftKeys = Object.keys(left);
  if (leftKeys.length !== Object.keys(right).length) return false;

  return leftKeys.every(
    (key) =>
      Object.prototype.hasOwnProperty.call(right, key) &&
      deepEqual(left[key], right[key]),
  );
}

// Both triggers fire on EVERY write to their document, including writes that
// touch only fields we don't own: FirestoreStore merges `stateCode` onto the
// parent `clientUpdatesV2` doc on every opportunity action, and writes
// `currentReviewerId` onto the subcollection doc. Patching on those rewrites
// the owned fields with values the index already has, and logs a PATCH plus a
// 404 probe against the person collection the record isn't in.
//
// Compare before against after rather than testing presence: removing a field
// is a real change and must still clear the indexed value.
export function ownedFieldsChanged(
  fields: string[],
  before: FirestoreDoc | null,
  after: FirestoreDoc | null,
): boolean {
  return fields.some(
    (field) => !deepEqual(before?.[field] ?? null, after?.[field] ?? null),
  );
}

// Builds the PATCH body. A deleted Firestore document clears the fields it owns
// rather than deleting the Typesense record — the record is owned by the ETL
// side and outlives any officer action on it. Declared fields are always
// present in the payload (null when absent) so that un-denying or un-snoozing
// actually clears the previous value instead of leaving it stale.
export function buildPatch(
  fields: string[],
  data: FirestoreDoc | null,
): FirestoreDoc {
  const patch: FirestoreDoc = {};
  for (const field of fields) {
    patch[field] = data?.[field] ?? null;
  }
  return patch;
}

// Splits a patch into the fields carrying a value and the fields being cleared.
// Only names are returned — the values are officer-entered denial reasons and
// reviewer emails, which don't belong in logs.
export function summarizePatch(patch: FirestoreDoc): {
  set: string[];
  cleared: string[];
} {
  const set: string[] = [];
  const cleared: string[] = [];
  for (const [field, value] of Object.entries(patch)) {
    (value === null ? cleared : set).push(field);
  }
  return { set, cleared };
}

export type SyncOutcome = {
  status: "patched" | "absent" | "skipped" | "unchanged";
  /** Collection the patch actually landed in; undefined unless status is "patched". */
  collection?: string;
  /** Composed Typesense doc id; undefined when the path wasn't recognized. */
  id?: string;
  /** Field names carrying a value. */
  set: string[];
  /** Field names explicitly nulled out. */
  cleared: string[];
};

// Applies one Firestore document change to Typesense. `data` is null when the
// document was deleted; `previousData` is null when it was created. The patch
// is decided by what changed — see ownedFieldsChanged.
export async function syncDocument(
  client: TypesenseClient,
  path: string,
  data: FirestoreDoc | null,
  previousData: FirestoreDoc | null,
): Promise<SyncOutcome> {
  const target = resolveTarget(path);
  if (!target) {
    console.warn(`[sync] SKIP  ${path} — path not synced`);
    return { status: "skipped", set: [], cleared: [] };
  }

  if (!ownedFieldsChanged(target.fields, previousData, data)) {
    console.debug(`[sync] NOOP  ${path} — no owned field changed`);
    return { status: "unchanged", id: target.id, set: [], cleared: [] };
  }

  const patch = buildPatch(target.fields, data);
  const { set, cleared } = summarizePatch(patch);
  let landedIn: string | undefined;

  for (const collection of target.collections) {
    try {
      // eslint-disable-next-line no-await-in-loop -- two collections at most, and the second only runs when the first 404s
      await client.collections(collection).documents(target.id).update(patch);
      landedIn = collection;
      break;
    } catch (err) {
      // 404 = the record isn't indexed in this collection. Expected for the
      // person collection the record doesn't belong to, and for the window
      // before the batch side has indexed a newly-eligible opportunity.
      // Anything else rethrows so the trigger retries.
      if ((err as { httpStatus?: number }).httpStatus !== 404) throw err;
      console.debug(`[sync]   miss  ${collection}/${target.id} (404)`);
    }
  }

  if (!landedIn) {
    // Not an error: the batch backfill reconciles these fields from Firestore
    // on every run, so a document the ETL hasn't indexed yet catches up then.
    console.warn(
      `[sync] ABSENT ${target.id} not in ${target.collections.join("/")} — leaving for the next backfill`,
    );
    return { status: "absent", id: target.id, set, cleared };
  }

  console.info(
    `[sync] PATCH ${landedIn}/${target.id} set=[${set.join(",")}] cleared=[${cleared.join(",")}]`,
  );
  return {
    status: "patched",
    collection: landedIn,
    id: target.id,
    set,
    cleared,
  };
}
