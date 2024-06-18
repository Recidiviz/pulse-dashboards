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

import { FirebaseApp, initializeApp } from "firebase/app";
import { getAuth, signInWithCustomToken } from "firebase/auth";
import {
  collection,
  doc,
  Firestore,
  getDoc,
  getDocs,
  getFirestore,
  query,
  where,
} from "firebase/firestore";
import { z } from "zod";

import { ResidentRecord, residentRecordSchema, StaffRecord } from "~datatypes";

import { FIRESTORE_GENERAL_COLLECTION_MAP } from "../constants";
import { FirestoreOfflineAPIClient } from "./FirestoreOfflineAPIClient";
import { FilterParams, FirestoreAPI } from "./interface";

export class FirestoreAPIClient implements FirestoreAPI {
  // TODO(#5322): remove reference to this when endpoints are live
  private offlineClient: FirestoreOfflineAPIClient;

  private app: FirebaseApp;

  private db: Firestore;

  constructor(
    private stateCode: string,
    projectId: string,
    apiKey: string,
  ) {
    this.offlineClient = new FirestoreOfflineAPIClient(stateCode);

    this.app = initializeApp({ projectId, apiKey });

    this.db = getFirestore(this.app);
  }

  async authenticate(firebaseToken: string) {
    const auth = getAuth(this.app);
    await signInWithCustomToken(auth, firebaseToken);
  }

  staffRecordsWithSupervisor(
    supervisorExternalId: string,
  ): Promise<StaffRecord[]> {
    return this.offlineClient.staffRecordsWithSupervisor(supervisorExternalId);
  }

  async residents(filters: Array<FilterParams> = []) {
    const snapshot = await getDocs(
      query(
        collection(this.db, FIRESTORE_GENERAL_COLLECTION_MAP.residents),
        where("stateCode", "==", this.stateCode),
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
      .filter((r): r is ResidentRecord["output"] => !!r);
  }

  resident(externalId: string) {
    return this.recordForExternalId(
      FIRESTORE_GENERAL_COLLECTION_MAP.residents,
      externalId,
      residentRecordSchema,
    );
  }

  async recordForExternalId<Schema extends z.ZodTypeAny>(
    collectionName: string,
    externalId: string,
    recordSchema: Schema,
  ): Promise<z.infer<Schema> | undefined> {
    const snapshot = await getDoc(
      doc(
        this.db,
        collectionName,
        `${this.stateCode.toLowerCase()}_${externalId}`,
      ),
    );

    if (!snapshot.exists()) return;

    return recordSchema.parse(snapshot.data());
  }
}
