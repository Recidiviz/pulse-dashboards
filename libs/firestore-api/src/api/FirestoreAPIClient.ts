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

// here we should not be accessing the raw mapping directly, only the mapping function
/* eslint no-restricted-syntax: ["error", "Identifier[name=FIRESTORE_GENERAL_COLLECTION_MAP]"] */
/* eslint no-restricted-properties: ["error", 
  { 
    "property": "parse", 
    "message": "use this.parseFirestoreDocument() instead of calling schema parse methods directly" 
  },
  { 
    "property": "safeParse", 
    "message": "use this.parseFirestoreDocument() instead of calling schema parse methods directly" 
  },
] */

import { FirebaseApp } from "firebase/app";
import {
  collection,
  doc,
  DocumentData,
  enableNetwork,
  Firestore,
  getDoc,
  getDocs,
  initializeFirestore,
  query,
  where,
} from "firebase/firestore";
import pRetry, { Options } from "p-retry";
import { z } from "zod";

import {
  LocationRecord,
  locationRecordSchema,
  ResidentRecord,
  residentRecordSchema,
  shiftAllDates,
} from "~datatypes";
import {
  collectionNameFromConfig,
  FirestoreCollectionKey,
} from "~firestore-config";

import { DuplicateRecordError, MissingRecordError } from "./errors";
import { FilterParams, FirestoreAPI } from "./interface";

export class FirestoreAPIClient implements FirestoreAPI {
  private db: Firestore;

  constructor(
    private app: FirebaseApp,
    private isDemoMode: () => boolean,
    private proxyHost?: string,
  ) {
    this.db = initializeFirestore(this.app, {
      ...(proxyHost
        ? {
            host: `${proxyHost}/firestore`,
            // this can be a little slower but seems to be more reliable
            // when accessing Firestore via proxy;
            // see https://github.com/firebase/firebase-js-sdk/issues/1674
            experimentalForceLongPolling: true,
          }
        : {}),
    });
  }

  private parseFirestoreDocument<Schema extends z.ZodTypeAny>(
    schema: Schema,
    data: DocumentData,
  ): z.infer<Schema> {
    // this is the one place where we're allowed to call this method,
    // to add logic for time-shifting dates in demo mode
    // eslint-disable-next-line no-restricted-properties
    const result = schema.parse(data);
    if (this.isDemoMode()) {
      // this is safe to call if dates have already been timeshifted,
      // but if they haven't it will ensure that they are. This is applicable
      // when demo data is fetched based on user permissions rather than environment config
      return shiftAllDates(result);
    }
    return result;
  }

  /**
   * Utility function for retrying Firestore fetches, particularly in the case of poor network conditions
   * @param fetchFn async function that makes a one-time Firestore request (NOT a subscription).
   * Rejections will be caught and potentially retried based on the options
   * @param retryIf optional function to make retries conditional; return false to bail out of retry loop
   * @returns whatever `fetchFn` returns
   */
  private fetchWithRetry<Result>(
    fetchFn: (...args: Array<unknown>) => Promise<Result>,
    retryIf?: Options["shouldRetry"],
  ): Promise<Result> {
    return pRetry(fetchFn, {
      // this is not a special number, just picked arbitrarily
      // because the default of 10 retries seemed too high for this use case
      retries: 3,
      // we don't need to wait before retrying because we'll force Firestore to try reconnecting first
      // and that action already carries a 10 second timeout
      minTimeout: 0,
      // Note that this function does not override the logic around counting retries etc.,
      // it just lets us apply additional conditions on top of that
      shouldRetry: async (ctx) => {
        const conditionsMet = (await retryIf?.(ctx)) ?? true;

        // try to get back online if bad connection has forced us into offline mode.
        // skip this if we aren't going to retry because it can take up to 10 seconds
        if (conditionsMet) await enableNetwork(this.db);

        return conditionsMet;
      },
    });
  }

  async residents(stateCode: string, filters: Array<FilterParams> = []) {
    const snapshot = await getDocs(
      query(
        collection(
          this.db,
          collectionNameFromConfig({
            name: { key: "residents" },
            demo: this.isDemoMode(),
          }),
        ),
        where("stateCode", "==", stateCode),
        ...filters.map((params) => where(...params)),
      ),
    );
    return snapshot.docs
      .map((d) => {
        try {
          return this.parseFirestoreDocument(residentRecordSchema, {
            ...d.data(),
            recordId: d.id,
          });
        } catch (e) {
          console.error(e);
          return;
        }
      })
      .filter((r): r is ResidentRecord => !!r);
  }

  async residentByPseudoId(stateCode: string, pseudoId: string) {
    return this.recordForUniqueId(
      stateCode,
      { key: "residents" },
      "pseudonymizedId",
      pseudoId,
      residentRecordSchema,
    );
  }

  /**
   * Use to look up documents by their document ID. Will throw if none is found;
   * check for `MissingRecordError` to identify that case during during error handling.
   * Missing records will be automatically retried because they can be caused by
   * poor network conditions.
   */
  async recordForExternalId<Schema extends z.ZodTypeAny>(
    stateCode: string,
    collectionKey: FirestoreCollectionKey,
    externalId: string,
    recordSchema: Schema,
  ): Promise<z.infer<Schema>> {
    return this.fetchWithRetry(
      async () => {
        const collectionName = collectionNameFromConfig({
          name: collectionKey,
          demo: this.isDemoMode(),
        });
        const documentId = `${stateCode.toLowerCase()}_${externalId}`;
        const snapshot = await getDoc(doc(this.db, collectionName, documentId));

        if (!snapshot.exists())
          throw new MissingRecordError(
            `No record at ${documentId} found in ${collectionName}`,
          );

        return this.parseFirestoreDocument(recordSchema, {
          ...snapshot.data(),
          recordId: snapshot.id,
        });
      },
      // Retry MissingRecordError because fetch timeouts can be masked by Firestore
      // automatically switching ito offline mode and finding nothing in the cache.
      ({ error }) => error instanceof MissingRecordError,
    );
  }

  /**
   * Use to lookup by a field that is expected to be unique
   * but is not actually used as the document ID.
   * Will throw if the collection does not contain exactly one matching record;
   * check for `MissingRecordError` or `DuplicateRecordError` classes to pinpoint
   * those specific causes during error handling. Missing records will be automatically
   * retried because they can be caused by poor network conditions.
   */
  private async recordForUniqueId<Schema extends z.ZodTypeAny>(
    stateCode: string,
    collectionKey: FirestoreCollectionKey,
    fieldName: string,
    fieldValue: string,
    recordSchema: Schema,
  ): Promise<z.infer<Schema>> {
    return this.fetchWithRetry(
      async () => {
        const resolvedCollectionName = collectionNameFromConfig({
          name: collectionKey,
          demo: this.isDemoMode(),
        });
        const snapshot = await getDocs(
          query(
            collection(this.db, resolvedCollectionName),
            where("stateCode", "==", stateCode),
            where(fieldName, "==", fieldValue),
          ),
        );

        if (snapshot.size === 0)
          throw new MissingRecordError(
            `Found no documents matching ${fieldName} = ${fieldValue} in ${resolvedCollectionName}`,
          );
        if (snapshot.size > 1) {
          throw new DuplicateRecordError(
            `Found ${snapshot.size} documents matching ${fieldName} = ${fieldValue} in ${resolvedCollectionName}, but only one was expected`,
          );
        }

        return this.parseFirestoreDocument(recordSchema, {
          ...snapshot.docs[0].data(),
          recordId: snapshot.docs[0].id,
        });
      },
      // Retry MissingRecordError because fetch timeouts can be masked by Firestore
      // automatically switching ito offline mode and finding nothing in the cache.
      ({ error }) => error instanceof MissingRecordError,
    );
  }

  /**
   * Use to query all documents in a collection that match the specified state code.
   */
  private async getAllForState<Schema extends z.ZodTypeAny>(
    stateCode: string,
    collectionKey: FirestoreCollectionKey,
    s: Schema,
  ): Promise<Array<z.infer<Schema>>> {
    const snapshot = await getDocs(
      query(
        collection(
          this.db,
          collectionNameFromConfig({
            demo: this.isDemoMode(),
            name: collectionKey,
          }),
        ),
        where("stateCode", "==", stateCode),
      ),
    );

    return snapshot.docs.map((d) => this.parseFirestoreDocument(s, d.data()));
  }

  async locations(stateCode: string): Promise<Array<LocationRecord>> {
    return this.getAllForState(
      stateCode,
      { key: "locations" },
      locationRecordSchema,
    );
  }
}
