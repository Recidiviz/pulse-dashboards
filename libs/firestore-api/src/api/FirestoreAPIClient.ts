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
import { Firestore, getFirestore } from "firebase/firestore";

import { StaffRecord } from "~datatypes";

import { FirestoreOfflineAPIClient } from "./FirestoreOfflineAPIClient";
import { FirestoreAPI } from "./interface";

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
}
