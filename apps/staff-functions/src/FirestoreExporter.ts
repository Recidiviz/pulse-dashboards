// Recidiviz - a data platform for criminal justice reform
// Copyright (C) 2024 Recidiviz, Inc.
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

import * as admin from "firebase-admin";
import {
  DocumentData,
  Firestore,
  Query,
  QueryDocumentSnapshot,
} from "firebase-admin/firestore";
import { defineString } from "firebase-functions/params";
import { onSchedule } from "firebase-functions/v2/scheduler";

import { formatDate } from "./utils";

const schedule = "0 8 * * *"; // 0800 UTC is Midnight PST

/**
 * Abstract class to export a set of data from Firebase on a schedule
 * Usage:
 *  1. Extend this class in a function file, overriding the abstract methods
 *  2. Create an instance of the child class, e.g. `exporter`
 *  3. Export the result of createScheduledFunction, e.g. `exports.myFunctionnName = exporter.createScheduledFunction()`
 *
 * @type T the type of the exported data
 */
export abstract class FirestoreExporter<T> {
  // The environment variable pointing to output bucket name
  protected abstract outputBucketEnvVar: string;

  /**
   * Creates the scheduled function that runs the backup once a day
   * This output of this method should be exported from the function file
   */
  createScheduledFunction() {
    this.initializeApp();

    const storage = admin.storage();
    const bucket = defineString(this.outputBucketEnvVar).value();

    return onSchedule(schedule, async () => {
      const baseQuery = this.docsQuery(admin.firestore());

      let lastDoc;
      const jsons: string[] = [];

      while (true) {
        const query: Query<DocumentData> = lastDoc
          ? baseQuery.limit(50).startAfter(lastDoc)
          : baseQuery.limit(50);

        // eslint-disable-next-line no-await-in-loop
        const { docs, empty } = await query.get();
        if (empty) break;
        lastDoc = docs[docs.length - 1];
        for (const doc of docs) {
          const data = this.firestoreDocToExportData(doc);
          if (data) {
            jsons.push(JSON.stringify(data));
          }
        }
      }

      storage
        .bucket(bucket)
        .file(`${formatDate(new Date())}.json`)
        .save(jsons.join("\n"));
    });
  }

  // Abstract methods

  /**
   * Returns the document query that will get the firestore docs to export
   * If the query includes a select, it should include an orderBy on the same field
   * so we can paginate through the results
   */
  abstract docsQuery(db: Firestore): Query<DocumentData>;

  /**
   * Convert the raw firestore document to the export data type
   * Undefined returned values will be filtered out
   */
  abstract firestoreDocToExportData(
    doc: QueryDocumentSnapshot<DocumentData>,
  ): T | undefined;

  // Utilities

  /**
   * Initialize firebase app, if not already initialized
   */
  private initializeApp() {
    if (admin.apps.length === 0) {
      admin.initializeApp();
    }
  }
}
