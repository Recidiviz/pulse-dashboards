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
// The two triggers write in DIFFERENT MODES. The difference is who owns the
// target document:
//
//   clientUpdatesV2/{recordId}                              → PATCH
//     `preferredName` onto a `clients`/`residents` document backfill-fn owns.
//     Never upsert here: upsert replaces the whole document and would wipe the
//     ETL-sourced fields. `update` 404s when the target does not exist, which
//     means the batch side has not indexed it yet.
//
//   clientUpdatesV2/{recordId}/{opportunityUpdates}/{docId}  → UPSERT
//     the whole `opportunityUpdates` document. backfill-fn writes it too, from
//     the same field list and the same derivation, so a full replace from
//     either is safe. A deleted Firestore document deletes its mirror.
//
// This function does NO READ: everything it stores derives from the write
// payload, via the shared function backfill-fn also imports. backfill-fn stays
// authoritative and reconciles on every run, so a miss here is self-healing.
//
// Each trigger owns a disjoint field set. A write that changed none of its
// owned fields is dropped before any Typesense call — see ownedFieldsChanged.
//
// Everything here is pure and takes the Typesense client as an argument; the
// firebase-functions trigger wiring lives in index.ts.

import type { Client as TypesenseClient } from "typesense";

import {
  deriveUpdateFields,
  type FirestoreDoc,
  mergeDocIdFromPath,
  OPPORTUNITY_UPDATE_FIELDS,
} from "~@typesense/client";

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
const OPPORTUNITY_UPDATES_COLLECTION = "opportunityUpdates";

const PERSON_UPDATE_FIELDS = ["preferredName"];

// `stateCode` is owned too: it lets a state-scoped backfill filter this group.
const OWNED_OPPORTUNITY_FIELDS = [...OPPORTUNITY_UPDATE_FIELDS, "stateCode"];

export type SyncTarget = {
  /**
   * `patch` writes only the owned fields onto a document another writer owns.
   * `own` writes the whole document, which backfill-fn builds identically —
   * same field list, same derivation — so replacing it loses nothing.
   */
  mode: "patch" | "own";
  // Every collection to attempt, in order. Only `patch` uses more than one.
  collections: string[];
  id: string;
  fields: string[];
};

// Splits a Firestore document path into the target collections, doc id and the
// field set this path owns, or null when the path isn't one we sync.
//
// The id comes from the shared mergeDocIdFromPath, which backfill-fn also calls
// when it merges these updates onto the ETL record. Both writers must address
// the same Typesense document, and neither fails loudly if they disagree.
export function resolveTarget(path: string): SyncTarget | null {
  const segments = path.split("/");

  if (segments[0] !== CLIENT_UPDATES_COLLECTION) return null;

  if (segments.length === 2) {
    return {
      mode: "patch",
      collections: PERSON_COLLECTIONS,
      id: mergeDocIdFromPath(path),
      fields: PERSON_UPDATE_FIELDS,
    };
  }

  if (
    segments.length === 4 &&
    segments[2] === OPPORTUNITY_UPDATES_SUBCOLLECTION
  ) {
    return {
      mode: "own",
      collections: [OPPORTUNITY_UPDATES_COLLECTION],
      id: mergeDocIdFromPath(path),
      fields: OWNED_OPPORTUNITY_FIELDS,
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

// Builds the whole document for an `own`-mode target.
//
// Absent fields are OMITTED rather than nulled — the opposite of buildPatch,
// and correct for the opposite reason: an upsert replaces the document, so
// leaving a field out already clears it. For `lastViewedTimestamp` that is
// load-bearing: the stale-alert partition queries for documents LACKING it.
export function buildDocument(
  fields: string[],
  data: FirestoreDoc | null,
  id: string,
): FirestoreDoc {
  const doc: FirestoreDoc = {};
  for (const field of fields) {
    const value = data?.[field];
    if (value !== undefined && value !== null) doc[field] = value;
  }
  return {
    ...doc,
    // Derived LAST so it wins over the raw projection: a derived value is
    // normalized, and the raw one is whatever the writer happened to store.
    ...deriveUpdateFields(data ?? {}, id),
    id,
  };
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
  status:
    | "patched"
    | "upserted"
    | "deleted"
    | "absent"
    | "skipped"
    | "unchanged";
  /** Collection the write landed in; undefined unless it landed. */
  collection?: string;
  /** Composed Typesense doc id; undefined when the path wasn't recognized. */
  id?: string;
  /** Field names carrying a value. */
  set: string[];
  /** Field names explicitly nulled out. */
  cleared: string[];
};

// The `own` mode: the whole document, because backfill-fn reconstructs the same
// one from the same source. They share `OPPORTUNITY_UPDATE_FIELDS` and
// `deriveUpdateFields`, so the two cannot drift apart into a partial replace.
//
// A deleted Firestore document DELETES its mirror rather than clearing fields —
// an update document IS the officer action, so with the action gone there is
// nothing left to describe.
async function syncOwnedDocument(
  client: TypesenseClient,
  target: SyncTarget,
  data: FirestoreDoc | null,
): Promise<SyncOutcome> {
  const [collection] = target.collections;

  if (data === null) {
    try {
      await client.collections(collection).documents(target.id).delete();
      console.info(`[sync] DELETE ${collection}/${target.id}`);
      return {
        status: "deleted",
        collection,
        id: target.id,
        set: [],
        cleared: [],
      };
    } catch (err) {
      // Already gone, which a re-delivered trigger produces. The backfill's
      // prune would remove it anyway, so there is nothing to retry.
      if ((err as { httpStatus?: number }).httpStatus !== 404) throw err;
      console.debug(
        `[sync]   miss  ${collection}/${target.id} (404 on delete)`,
      );
      return {
        status: "absent",
        collection,
        id: target.id,
        set: [],
        cleared: [],
      };
    }
  }

  const doc = buildDocument(target.fields, data, target.id);
  // Reported as a patch reports an explicit null, so the log shape is stable.
  const set = target.fields.filter((field) => field in doc);
  const cleared = target.fields.filter((field) => !(field in doc));

  // Upsert, not update: nothing else writes this document, and an upsert
  // creates — which makes an officer's action visible before the batch side
  // has ever seen it.
  await client.collections(collection).documents().upsert(doc);

  console.info(
    `[sync] UPSERT ${collection}/${target.id} status=${String(doc["updateStatus"])} action=${String(doc["hasOfficerAction"])} set=[${set.join(",")}]`,
  );
  return { status: "upserted", collection, id: target.id, set, cleared };
}

// Applies one Firestore document change to Typesense. `data` is null when the
// document was deleted; `previousData` is null when it was created. The write
// is decided by what changed — see ownedFieldsChanged — and how it is written
// by the target's mode.
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

  if (target.mode === "own") {
    return syncOwnedDocument(client, target, data);
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
