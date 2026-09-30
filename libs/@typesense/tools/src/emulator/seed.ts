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

// One-shot seed: drops and recreates Typesense collections, then imports docs
// from the Firestore emulator. Run after `nx offline staff` is up if you only
// need a single snapshot. For live sync, use `nx offline-sync '@typesense/tools'`
// instead.

import { createLocalTypesenseClient, schemas } from "~@typesense/client";

import {
  createLocalFirestoreClient,
  dropAndCreateCollection,
  importForSchema,
  waitForFirestoreEmulator,
  waitForTypesense,
} from "./helpers";

async function main() {
  const db = createLocalFirestoreClient();
  const typesense = createLocalTypesenseClient();

  console.info(`Connecting to Typesense and Firestore emulator...`);
  await Promise.all([
    waitForTypesense(typesense),
    waitForFirestoreEmulator(db),
  ]);

  /* eslint-disable no-await-in-loop -- collections are seeded sequentially to keep log output ordered */
  for (const schema of schemas) {
    await dropAndCreateCollection(typesense, schema);
    // Two collections are not 1:1 with a Firestore collection, so the
    // name-matching import finds nothing for them. See the derived-collections
    // block in helpers.ts. `opportunities` must be seeded AFTER the person
    // collections, which the schema order guarantees, because it merges their
    // scope — and `opportunityUpdates` references `opportunities`.
    const count = await importForSchema(typesense, db, schema.name);
    console.info(
      count === 0
        ? `[${schema.name}] no docs in Firestore emulator, skipping import`
        : `[${schema.name}] imported ${count} docs`,
    );
  }
  /* eslint-enable no-await-in-loop */

  console.info("Seed complete.");
  process.exit(0);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
