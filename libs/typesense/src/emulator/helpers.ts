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

import { DocumentData, Firestore } from "@google-cloud/firestore";
import type { Client as TypesenseClient } from "typesense";

import { COLLECTIONS_WITH_SOURCE_ID, schemas } from "../schemas";

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

// Returns the id to use when writing a doc to Typesense. For collections in
// COLLECTIONS_WITH_SOURCE_ID (staff, locations) we use the record's own `id`
// field so cross-collection references like `client.officerId → staff.id`
// resolve directly; for everything else we use the composite Firestore doc id.
export function resolveTypesenseId(
  collectionName: string,
  data: DocumentData,
  firestoreDocId: string,
): string {
  if (
    COLLECTIONS_WITH_SOURCE_ID.has(collectionName) &&
    typeof data["id"] === "string"
  ) {
    return data["id"];
  }
  return firestoreDocId;
}

// Typesense v1.x returns newline-separated JSON results from import().
// Newer versions may return an already-parsed array. Normalize to string[].
export function normalizeImportResult(result: unknown): string[] {
  if (typeof result === "string") return result.split("\n").filter(Boolean);
  if (Array.isArray(result)) return result.map((r) => JSON.stringify(r));
  return [];
}

export async function importCollection(
  typesense: TypesenseClient,
  db: Firestore,
  collectionName: string,
): Promise<number> {
  const snapshot = await db.collection(collectionName).get();
  if (snapshot.empty) return 0;

  const docs = snapshot.docs.map((d) => {
    const data = d.data();
    return { ...data, id: resolveTypesenseId(collectionName, data, d.id) };
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
