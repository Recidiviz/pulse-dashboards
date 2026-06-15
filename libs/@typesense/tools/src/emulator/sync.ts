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

// Long-running watcher: drops and recreates Typesense collections, performs
// an initial bulk import, then subscribes to Firestore emulator changes via
// onSnapshot and mirrors them to Typesense in real time. Brought up alongside
// `nx offline staff`.
//
// Stand-in for the production Firestore→Typesense extension (which is
// HTTPS-only and can't talk to local HTTP Typesense). The watcher's behavior
// will eventually match the extension's for the non-opportunity collections;
// for opportunities, it doubles as a prototype for the custom Cloud Function
// that handles discriminator stamping in production.

import type { Firestore } from "@google-cloud/firestore";
import type { Client as TypesenseClient } from "typesense";

import { createLocalTypesenseClient, schemas } from "~@typesense/client";

import {
  createLocalFirestoreClient,
  dropAndCreateCollection,
  importCollection,
  resolveTypesenseId,
  waitForFirestoreEmulator,
  waitForTypesense,
} from "./helpers";

function subscribeToCollection(
  typesense: TypesenseClient,
  db: Firestore,
  collectionName: string,
): () => void {
  // Compare each doc's updateTime to subscription start so we skip docs that
  // existed before the watcher subscribed (those are already in Typesense from
  // the bulk import), but process any edit made after — even if it lands in
  // the very first onSnapshot fire.
  const subscribedAtMs = Date.now();
  console.info(`[${collectionName}] subscribed`);

  return db.collection(collectionName).onSnapshot(
    (snapshot) => {
      console.info(
        `[${collectionName}] snapshot: ${snapshot.docChanges().length} change(s)`,
      );

      for (const change of snapshot.docChanges()) {
        const data = change.doc.data();
        const id = resolveTypesenseId(collectionName, data, change.doc.id);

        if (change.type === "removed") {
          typesense
            .collections(collectionName)
            .documents(id)
            .delete()
            .then(() => console.info(`[${collectionName}] deleted ${id}`))
            .catch((err: Error) =>
              console.error(
                `[${collectionName}] delete ${id} failed:`,
                err.message,
              ),
            );
          continue;
        }

        const docUpdateMs = change.doc.updateTime.toMillis();
        if (docUpdateMs <= subscribedAtMs) {
          // Pre-existing doc, already bulk-imported.
          continue;
        }

        typesense
          .collections(collectionName)
          .documents()
          .upsert({ ...data, id })
          .then(() => console.info(`[${collectionName}] upserted ${id}`))
          .catch((err: Error) =>
            console.error(
              `[${collectionName}] upsert ${id} failed:`,
              err.message,
            ),
          );
      }
    },
    (err: Error) =>
      console.error(`[${collectionName}] subscription error:`, err.message),
  );
}

async function main() {
  const db = createLocalFirestoreClient();
  const typesense = createLocalTypesenseClient();

  console.info("Connecting to Typesense and Firestore emulator...");
  await Promise.all([
    waitForTypesense(typesense),
    waitForFirestoreEmulator(db),
  ]);

  /* eslint-disable no-await-in-loop -- collections are seeded sequentially to keep log output ordered */
  for (const schema of schemas) {
    await dropAndCreateCollection(typesense, schema);
    const count = await importCollection(typesense, db, schema.name);
    console.info(
      count === 0
        ? `[${schema.name}] initial: no docs in Firestore emulator`
        : `[${schema.name}] initial: imported ${count} docs`,
    );
  }
  /* eslint-enable no-await-in-loop */

  const unsubscribers = schemas.map((s) =>
    subscribeToCollection(typesense, db, s.name),
  );

  console.info("Watching Firestore emulator for changes. Ctrl+C to stop.");

  const shutdown = () => {
    console.info("\nShutting down sync...");
    unsubscribers.forEach((u) => u());
    process.exit(0);
  };
  process.on("SIGINT", shutdown);
  process.on("SIGTERM", shutdown);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
