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
      const db = admin.firestore();
      const { docs } = await this.docsQuery(db).get();

      const newlineJson = docs
        .map((snapshot) =>
          JSON.stringify(this.firestoreDocToExportData(snapshot)),
        )
        .filter(Boolean)
        .join("\n");

      storage
        .bucket(bucket)
        .file(`${formatDate(new Date())}.json`)
        .save(newlineJson);
    });
  }

  // Abstract methods

  /**
   * Returns the document query that will get the firestore docs to export
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