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

// One-shot seed: drops and recreates Typesense collections, then
// imports docs from the Firestore emulator. Run after `nx offline staff` is up.
// Note: this script will be run for offline collections only. Staging and
// Production collections will be synced via an extension. The extension only
// syncs via https (SSL), which cannot be emulated in offline mode so explicit sync/seed
// is necessary

/* eslint-disable no-await-in-loop --
 * Sequential awaits in loops are intentional throughout this script:
 *   - readiness probes need to wait between attempts
 *   - import chunks are submitted one at a time to avoid overwhelming Typesense
 *   - collections are seeded sequentially to keep log output ordered
 */

import admin from "firebase-admin";
import type { Client as TypesenseClient } from "typesense";

import { createLocalTypesenseClient } from "../client";
import { COLLECTIONS_WITH_SOURCE_ID, schemas } from "../schemas";

const FIRESTORE_EMULATOR_HOST =
  process.env["FIRESTORE_EMULATOR_HOST"] ?? "localhost:8080";
const FIREBASE_PROJECT_ID = process.env["FIREBASE_PROJECT_ID"] ?? "demo-dev";

const IMPORT_CHUNK_SIZE = 500;
const READINESS_MAX_ATTEMPTS = 30;

const sleep = (ms: number) =>
  new Promise<void>((resolve) => setTimeout(resolve, ms));

async function waitForTypesense(client: TypesenseClient): Promise<void> {
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

async function waitForFirestoreEmulator(
  db: admin.firestore.Firestore,
): Promise<void> {
  for (let i = 0; i < READINESS_MAX_ATTEMPTS; i++) {
    try {
      await db.listCollections();
      return;
    } catch {
      // not ready yet
    }
    await sleep(1000);
  }
  throw new Error(
    `Firestore emulator did not become reachable after ${READINESS_MAX_ATTEMPTS}s`,
  );
}

async function dropAndCreateCollection(
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
function normalizeImportResult(result: unknown): string[] {
  if (typeof result === "string") return result.split("\n").filter(Boolean);
  if (Array.isArray(result)) return result.map((r) => JSON.stringify(r));
  return [];
}

async function importCollection(
  typesense: TypesenseClient,
  db: admin.firestore.Firestore,
  collectionName: string,
): Promise<number> {
  const snapshot = await db.collection(collectionName).get();
  if (snapshot.empty) return 0;

  const useSourceId = COLLECTIONS_WITH_SOURCE_ID.has(collectionName);
  const docs = snapshot.docs.map((d) => {
    const data = d.data();
    return {
      ...data,
      id: useSourceId && typeof data["id"] === "string" ? data["id"] : d.id,
    };
  });

  let imported = 0;
  for (let i = 0; i < docs.length; i += IMPORT_CHUNK_SIZE) {
    const chunk = docs.slice(i, i + IMPORT_CHUNK_SIZE);
    const result: unknown = await typesense
      .collections(collectionName)
      .documents()
      .import(chunk, { action: "upsert" });

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

async function main() {
  process.env["FIRESTORE_EMULATOR_HOST"] = FIRESTORE_EMULATOR_HOST;

  admin.initializeApp({ projectId: FIREBASE_PROJECT_ID });
  const db = admin.firestore();
  const typesense = createLocalTypesenseClient();

  console.info(`Connecting to Typesense and Firestore emulator...`);
  await Promise.all([
    waitForTypesense(typesense),
    waitForFirestoreEmulator(db),
  ]);

  for (const schema of schemas) {
    await dropAndCreateCollection(typesense, schema);
    const count = await importCollection(typesense, db, schema.name);
    console.info(
      count === 0
        ? `[${schema.name}] no docs in Firestore emulator, skipping import`
        : `[${schema.name}] imported ${count} docs`,
    );
  }

  console.info("Seed complete.");
  process.exit(0);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
