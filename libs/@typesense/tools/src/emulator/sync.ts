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
// Stand-in for apps/@typesense/sync-fn, the production Firestore→Typesense
// path (which is HTTPS-only and can't talk to local HTTP Typesense). The
// watcher's behavior tracks sync-fn's for the non-opportunity collections; for
// opportunities it also does the discriminator stamping that sync-fn does in
// production.

import type { Firestore } from "@google-cloud/firestore";
import type { Client as TypesenseClient } from "typesense";

import {
  createLocalTypesenseClient,
  type FirestoreDoc,
  mergeDocIdFromPath,
  schemas,
} from "~@typesense/client";

import {
  createLocalFirestoreClient,
  DERIVED_IMPORTERS,
  DERIVED_WATCH_SOURCES,
  dropAndCreateCollection,
  importForSchema,
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

  return db.collection(collectionName).onSnapshot(
    (snapshot) => {
      for (const change of snapshot.docChanges()) {
        const data = change.doc.data();
        const id = change.doc.id;

        if (change.type === "removed") {
          typesense
            .collections(collectionName)
            .documents(id)
            .delete()
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

/**
 * Mirrors live edits to a DERIVED collection whose rows are per-document.
 *
 * Officer actions land in `clientOpportunityUpdates` under the person, not in a
 * collection named for the Typesense one. Without this, acting on an
 * opportunity locally leaves Typesense untouched until the next reseed.
 *
 * A collection GROUP query, and the Typesense id comes from the document PATH,
 * so `change.doc.id` is not usable here.
 */
function subscribeToDerivedCollection(
  typesense: TypesenseClient,
  db: Firestore,
  collectionName: string,
  { collectionGroup, project }: (typeof DERIVED_WATCH_SOURCES)[string],
): () => void {
  const subscribedAtMs = Date.now();

  return db.collectionGroup(collectionGroup).onSnapshot(
    (snapshot) => {
      for (const change of snapshot.docChanges()) {
        const id = mergeDocIdFromPath(change.doc.ref.path);

        if (change.type === "removed") {
          typesense
            .collections(collectionName)
            .documents(id)
            .delete()
            .catch((err: Error) =>
              console.error(
                `[${collectionName}] delete ${id} failed:`,
                err.message,
              ),
            );
          continue;
        }

        if (change.doc.updateTime.toMillis() <= subscribedAtMs) continue;

        typesense
          .collections(collectionName)
          .documents()
          .upsert(
            project(change.doc.data() as FirestoreDoc, change.doc.ref.path),
          )
          .catch((err: Error) =>
            console.error(
              `[${collectionName}] upsert ${id} failed:`,
              err.message,
            ),
          );
      }
    },
    (err: Error) =>
      console.error(
        `[${collectionName}] ${collectionGroup} subscription error:`,
        err.message,
      ),
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

  /* eslint-disable no-await-in-loop -- collections are seeded sequentially */
  for (const schema of schemas) {
    await dropAndCreateCollection(typesense, schema);
    await importForSchema(typesense, db, schema.name);
  }
  /* eslint-enable no-await-in-loop */

  // A derived collection has no Firestore collection of its own to subscribe
  // to, so a per-document one is watched through its SOURCE. `opportunities` is
  // merged from many sources, so editing one of its fixtures still needs
  // `nx offline-seed '@typesense/tools'`.
  const unsubscribers = [
    ...schemas
      .filter((s) => !DERIVED_IMPORTERS[s.name])
      .map((s) => subscribeToCollection(typesense, db, s.name)),
    ...Object.entries(DERIVED_WATCH_SOURCES).map(([name, source]) =>
      subscribeToDerivedCollection(typesense, db, name, source),
    ),
  ];

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
