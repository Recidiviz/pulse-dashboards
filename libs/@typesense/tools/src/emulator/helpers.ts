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

// Shared utilities for the Firestore-emulator → local-Typesense scripts.

/* eslint-disable no-await-in-loop --
 * Sequential awaits in loops are intentional throughout this script:
 *   - readiness probes need to wait between attempts
 *   - import chunks are submitted one at a time to avoid overwhelming Typesense
 *   - collections are seeded sequentially to keep log output ordered
 */

import { Firestore } from "@google-cloud/firestore";
import type { Client as TypesenseClient } from "typesense";

import {
  composeDocIdFromFields,
  deriveOpportunityFields,
  deriveUpdateFields,
  type DocumentSystem,
  type FirestoreDoc,
  mergeDocIdFromPath,
  OPPORTUNITY_UPDATE_FIELDS,
  schemas,
} from "~@typesense/client";

const FIRESTORE_EMULATOR_HOST =
  process.env["FIRESTORE_EMULATOR_HOST"] ?? "localhost:8080";
const FIREBASE_PROJECT_ID = process.env["FIREBASE_PROJECT_ID"] ?? "demo-dev";

export function createLocalFirestoreClient(): Firestore {
  return new Firestore({
    projectId: FIREBASE_PROJECT_ID,
    host: FIRESTORE_EMULATOR_HOST,
    ssl: false,
    credentials: {},
  });
}

export const IMPORT_CHUNK_SIZE = 500;
export const READINESS_MAX_ATTEMPTS = 30;

export const sleep = (ms: number) =>
  new Promise<void>((resolve) => setTimeout(resolve, ms));

export async function waitForTypesense(client: TypesenseClient): Promise<void> {
  for (let i = 0; i < READINESS_MAX_ATTEMPTS; i++) {
    try {
      const health = await client.health.retrieve();
      if (health.ok) return;
    } catch {
      // not ready yet
    }
    await sleep(1000);
  }
  throw new Error(
    `Typesense did not become healthy after ${READINESS_MAX_ATTEMPTS}s`,
  );
}

export async function waitForFirestoreEmulator(db: Firestore): Promise<void> {
  let reachable = false;

  for (let i = 0; i < READINESS_MAX_ATTEMPTS; i++) {
    try {
      const collections = await db.listCollections();
      reachable = true;
      // Reachable is not READY. The emulator answers the moment it listens and
      // keeps importing afterwards, so an early caller sees an empty database.
      // The derived importers discover their sources through this very call, so
      // an empty list makes them import nothing and report success.
      if (collections.length > 0) return;
    } catch {
      // not reachable yet
    }
    await sleep(1000);
  }

  if (!reachable) {
    throw new Error(
      `Firestore emulator did not become reachable after ${READINESS_MAX_ATTEMPTS}s`,
    );
  }
  // A genuinely empty emulator is legitimate, so proceed rather than fail — but
  // say so, because the other reading is that the import never finished.
  console.warn(
    `Firestore emulator is reachable but reports no collections after ${READINESS_MAX_ATTEMPTS}s — importing anyway.`,
  );
}

export async function dropAndCreateCollection(
  typesense: TypesenseClient,
  schema: (typeof schemas)[number],
): Promise<void> {
  try {
    await typesense.collections(schema.name).delete();
  } catch (err: unknown) {
    const status = (err as { httpStatus?: number })?.httpStatus;
    if (status !== 404) throw err;
  }
  await typesense.collections().create(schema);
}

// Typesense v1.x returns newline-separated JSON results from import().
// Newer versions may return an already-parsed array. Normalize to string[].
export function normalizeImportResult(result: unknown): string[] {
  if (typeof result === "string") return result.split("\n").filter(Boolean);
  if (Array.isArray(result)) return result.map((r) => JSON.stringify(r));
  return [];
}
/** Chunked upsert with per-line failure reporting. */
export async function importDocs(
  typesense: TypesenseClient,
  collectionName: string,
  docs: FirestoreDoc[],
): Promise<number> {
  let imported = 0;
  for (let i = 0; i < docs.length; i += IMPORT_CHUNK_SIZE) {
    const chunk = docs.slice(i, i + IMPORT_CHUNK_SIZE);
    // The client THROWS when any line fails, carrying per-line results on the
    // error. Worth reporting, not worth aborting the seed for.
    let result: unknown;
    try {
      result = await typesense
        .collections(collectionName)
        .documents()
        .import(chunk, { action: "upsert" });
    } catch (err) {
      result = (err as { importResults?: unknown }).importResults ?? [];
    }

    const lines = normalizeImportResult(result);
    const failures = lines.filter((line: string) => {
      try {
        return JSON.parse(line).success === false;
      } catch {
        return false;
      }
    });
    if (failures.length > 0) {
      console.warn(
        `[${collectionName}] ${failures.length}/${chunk.length} docs failed; first failure:`,
        failures[0],
      );
    }
    imported += chunk.length - failures.length;
  }

  return imported;
}

export async function importCollection(
  typesense: TypesenseClient,
  db: Firestore,
  collectionName: string,
): Promise<number> {
  const snapshot = await db.collection(collectionName).get();
  if (snapshot.empty) return 0;

  const docs = snapshot.docs.map((d) => ({ ...d.data(), id: d.id }));

  return importDocs(typesense, collectionName, docs);
}

// ---------------------------------------------------------------------------
// Derived collections
//
// `opportunities` (fed by many per-state `US_XX-<type>` collections) and
// `opportunityUpdates` (fed by the `clientOpportunityUpdates` subcollection
// group) are not 1:1 with a Firestore collection, so the name-matching import
// above finds nothing for them.
//
// What follows rebuilds them the way backfill-fn does — the one place here that
// DUPLICATES production logic, because this library cannot import an app. Keep
// it aligned with `export-collections.ts`.
//
// An opportunity carries the three SCOPE fields merged from its person: a key
// that cannot match them makes every scoped-key spec vacuous.
// ---------------------------------------------------------------------------

const OPPORTUNITY_SOURCE_PATTERN = /^US_[A-Z]{2}-/;

type PersonScopeFields = {
  officerId?: unknown;
  locationId?: unknown;
  system: DocumentSystem;
};

/**
 * One `clientOpportunityUpdates` document as its `opportunityUpdates` row.
 *
 * Per DOCUMENT, so the watcher can re-derive a single officer action. Shared
 * with the bulk importer so a live edit and a reseed cannot disagree.
 */
export function projectOpportunityUpdate(
  data: FirestoreDoc,
  path: string,
): FirestoreDoc {
  // The path, not the Firestore doc id: every person's subcollection has a
  // document named for the opportunity type, so the id alone is not unique.
  const id = mergeDocIdFromPath(path);
  const projected: FirestoreDoc = {};
  for (const field of OPPORTUNITY_UPDATE_FIELDS) {
    if (data[field] !== undefined && data[field] !== null) {
      projected[field] = data[field];
    }
  }
  return { ...projected, ...deriveUpdateFields(data, id), id };
}

/** Person id -> the scope an opportunity of theirs inherits. */
async function loadPersonScope(
  db: Firestore,
): Promise<Map<string, PersonScopeFields>> {
  const byId = new Map<string, PersonScopeFields>();

  for (const [collection, locationField, system] of [
    ["clients", "district", "SUPERVISION"],
    ["residents", "facilityId", "INCARCERATION"],
  ] as const) {
    const snapshot = await db.collection(collection).get();
    for (const doc of snapshot.docs) {
      const data = doc.data();
      byId.set(doc.id, {
        officerId: data["officerId"],
        locationId: data[locationField],
        system,
      });
    }
  }

  return byId;
}

function copyIfPresent(
  data: FirestoreDoc,
  keys: readonly string[],
): FirestoreDoc {
  const out: FirestoreDoc = {};
  for (const key of keys) {
    if (key in data) out[key] = data[key];
  }
  return out;
}

export async function importOpportunities(
  typesense: TypesenseClient,
  db: Firestore,
): Promise<number> {
  const sources = (await db.listCollections())
    .map((c) => c.id)
    .filter((id) => OPPORTUNITY_SOURCE_PATTERN.test(id));
  if (sources.length === 0) return 0;

  const personScope = await loadPersonScope(db);
  const docs: FirestoreDoc[] = [];
  let skippedUntyped = 0;

  for (const source of sources) {
    const snapshot = await db.collection(source).get();
    for (const doc of snapshot.docs) {
      const data = doc.data() as FirestoreDoc;
      const id = composeDocIdFromFields(
        data,
        ["stateCode", "externalId", "opportunityType", "opportunityId"],
        ["stateCode"],
      );
      const personId = composeDocIdFromFields(
        data,
        ["stateCode", "externalId"],
        ["stateCode"],
      );
      // Without the type, `composeDocIdFromFields` skips that segment and two
      // of one person's opportunities compose the SAME id. Skip rather than
      // collide — locally this means a fixture predating the stamp.
      if (!data["opportunityType"]) {
        skippedUntyped += 1;
        continue;
      }
      if (!id || !personId) continue;

      const scope = personScope.get(personId);
      docs.push({
        stateCode: data["stateCode"],
        opportunityType: data["opportunityType"],
        externalId: data["externalId"],
        ...(data["opportunityId"] !== undefined
          ? { opportunityId: data["opportunityId"] }
          : {}),
        isEligible: data["isEligible"] ?? false,
        isAlmostEligible: data["isAlmostEligible"] ?? false,
        // `in`, not an undefined check, because that is the test
        // `projectFields` uses: a key present and null is copied as null.
        ...copyIfPresent(data, [
          "opportunityPseudonymizedId",
          "eligibleDate",
          "almostEligibleDate",
        ]),
        ...deriveOpportunityFields(data),
        sourceCollection: source,
        // Only the reference whose collection holds this person: the other
        // would claim a join edge that does not exist.
        ...(scope?.system === "SUPERVISION" ? { clientDocId: personId } : {}),
        ...(scope?.system === "INCARCERATION"
          ? { residentDocId: personId }
          : {}),
        // Absent when the person is not in the fixtures. Left unset, as the
        // real backfill does, so a key simply never matches it.
        ...(scope?.officerId !== undefined
          ? { officerId: scope.officerId }
          : {}),
        ...(scope?.locationId !== undefined
          ? { locationId: scope.locationId }
          : {}),
        ...(scope ? { system: scope.system } : {}),
        id,
      });
    }
  }

  if (skippedUntyped > 0) {
    console.warn(
      `[opportunities] skipped ${skippedUntyped} source doc(s) with no opportunityType — they would collide on a composed id`,
    );
  }

  return importDocs(typesense, "opportunities", docs);
}

export async function importOpportunityUpdates(
  typesense: TypesenseClient,
  db: Firestore,
): Promise<number> {
  const snapshot = await db.collectionGroup("clientOpportunityUpdates").get();
  if (snapshot.empty) return 0;

  const docs = snapshot.docs.map((doc) =>
    projectOpportunityUpdate(doc.data() as FirestoreDoc, doc.ref.path),
  );

  return importDocs(typesense, "opportunityUpdates", docs);
}

/**
 * The Firestore source each derived collection watches for LIVE edits.
 *
 * Only `opportunityUpdates` is here: `opportunities` is merged from many
 * sources, so a single change cannot be re-derived without re-reading them all.
 */
export const DERIVED_WATCH_SOURCES: Record<
  string,
  {
    /** A collection GROUP: these documents live under each person. */
    collectionGroup: string;
    project: (data: FirestoreDoc, path: string) => FirestoreDoc;
  }
> = {
  opportunityUpdates: {
    collectionGroup: "clientOpportunityUpdates",
    project: projectOpportunityUpdate,
  },
};

/**
 * Collections rebuilt from a shape the name-matching import cannot express.
 * Shared by the seed and the sync watcher so the two cannot disagree about what
 * "seeded" means.
 */
export const DERIVED_IMPORTERS: Record<
  string,
  (typesense: TypesenseClient, db: Firestore) => Promise<number>
> = {
  opportunities: importOpportunities,
  opportunityUpdates: importOpportunityUpdates,
};

export async function importForSchema(
  typesense: TypesenseClient,
  db: Firestore,
  collectionName: string,
): Promise<number> {
  const derived = DERIVED_IMPORTERS[collectionName];
  return derived
    ? derived(typesense, db)
    : importCollection(typesense, db, collectionName);
}
