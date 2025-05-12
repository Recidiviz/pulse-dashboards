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

import { FirebaseApp, initializeApp } from "firebase/app";
import { getAuth, signInWithCustomToken } from "firebase/auth";
import {
  collection,
  doc,
  Firestore,
  getDoc,
  getDocs,
  initializeFirestore,
  query,
  where,
} from "firebase/firestore";
import { z } from "zod";

import { ResidentRecord, residentRecordSchema } from "~datatypes";

import { FirestoreCollectionKey } from "../types";
import { collectionNameForKey } from "../utils/collectionNameForKey";
import { FilterParams, FirestoreAPI } from "./interface";

export class FirestoreAPIClient implements FirestoreAPI {
  private app: FirebaseApp;

  private db: Firestore;

  constructor(
    projectId: string,
    apiKey: string,
    private proxyHost?: string,
  ) {
    this.app = initializeApp({ projectId, apiKey });

    this.db = initializeFirestore(this.app, {
      ...(proxyHost ? { host: `${proxyHost}/firestore` } : {}),
    });
  }

  async authenticate(firebaseToken: string) {
    const auth = getAuth(this.app);
    if (this.proxyHost) {
      // there seems to be no documented API for changing this config,
      // but editing it directly works! Only making the overrides necessary
      // to support custom token logins, not every possible API call
      auth.config.apiHost = `${this.proxyHost}/gcp-identitytoolkit`;
      auth.config.tokenApiHost = `${this.proxyHost}/gcp-securetoken`;
    }
    await signInWithCustomToken(auth, firebaseToken);
  }

  async residents(stateCode: string, filters: Array<FilterParams> = []) {
    const snapshot = await getDocs(
      query(
        collection(this.db, collectionNameForKey({ key: "residents" })),
        where("stateCode", "==", stateCode),
        ...filters.map((params) => where(...params)),
      ),
    );
    return snapshot.docs
      .map((d) => {
        try {
          return residentRecordSchema.parse(d.data());
        } catch (e) {
          console.error(e);
          return;
        }
      })
      .filter((r): r is ResidentRecord => !!r);
  }

  resident(stateCode: string, externalId: string) {
    return this.recordForExternalId(
      stateCode,
      { key: "residents" },
      externalId,
      residentRecordSchema,
    );
  }

  residentByPseudoId(stateCode: string, pseudoId: string) {
    return this.recordForUniqueId(
      stateCode,
      { key: "residents" },
      "pseudonymizedId",
      pseudoId,
      residentRecordSchema,
    );
  }

  async recordForExternalId<Schema extends z.ZodTypeAny>(
    stateCode: string,
    collectionKey: FirestoreCollectionKey,
    externalId: string,
    recordSchema: Schema,
  ): Promise<z.infer<Schema> | undefined> {
    const snapshot = await getDoc(
      doc(
        this.db,
        collectionNameForKey(collectionKey),
        `${stateCode.toLowerCase()}_${externalId}`,
      ),
    );

    if (!snapshot.exists()) return;

    return recordSchema.parse(snapshot.data());
  }

  /**
   * Use to lookup by a field that is expected to be unique
   * but is not actually used as the document ID.
   * Will throw if more than one record is found
   */
  private async recordForUniqueId<Schema extends z.ZodTypeAny>(
    stateCode: string,
    collectionKey: FirestoreCollectionKey,
    fieldName: string,
    fieldValue: string,
    recordSchema: Schema,
  ): Promise<z.infer<Schema> | undefined> {
    const resolvedCollectionName = collectionNameForKey(collectionKey);
    const snapshot = await getDocs(
      query(
        collection(this.db, resolvedCollectionName),
        where("stateCode", "==", stateCode),
        where(fieldName, "==", fieldValue),
      ),
    );

    if (snapshot.size === 0) return;
    if (snapshot.size > 1) {
      throw new Error(
        `Found ${snapshot.size} documents matching ${fieldName} = ${fieldValue} in ${resolvedCollectionName}, but only one was expected`,
      );
    }

    return recordSchema.parse(snapshot.docs[0].data());
  }
}
