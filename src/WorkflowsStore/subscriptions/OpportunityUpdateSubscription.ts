// Recidiviz - a data platform for criminal justice reform
// Copyright (C) 2022 Recidiviz, Inc.
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

import {
  doc,
  DocumentReference,
  Firestore,
  getDoc,
  setDoc,
} from "firebase/firestore";

import FirestoreStore, {
  ClientUpdateRecord,
  collectionNames,
  OpportunityUpdate,
  OpportunityUpdateWithForm,
} from "../../FirestoreStore";
import { OpportunityType } from "../Opportunity";
import { CollectionDocumentSubscription } from "./CollectionDocumentSubscription";

// TODO(#2108): Clean up requests to `clientUpdates` after fully migrating to `clientUpdatesV2`
const getClientUpdatesV2DocRef = async function (
  db: Firestore,
  clientId: string,
  recordId: string
): Promise<{
  docRef: DocumentReference<ClientUpdateRecord>;
  oldDocument: ClientUpdateRecord | undefined;
}> {
  let oldDocument;
  const docRef = doc(db, collectionNames.clientUpdatesV2, recordId);
  const newDocument = await getDoc(docRef);

  if (!newDocument.exists()) {
    // Get old document to merge with new updates
    oldDocument = (
      await getDoc(doc(db, collectionNames.clientUpdates, clientId))
    ).data();
  }

  return { docRef, oldDocument };
};

/**
 * This will migrate legacy data to the new subcollection, if there is no document in the
 * new subcollection but legacy data exists. It will not change any data in legacy collections,
 * but the expectation is that they will be ignored once the new collection is populated.
 * TODO(#2108): Remove this function after migration is complete
 */
async function migrateOpportunityUpdate(
  db: Firestore,
  updateDocRef: DocumentReference,
  clientId: string,
  clientRecordId: string,
  opportunityType: OpportunityType
) {
  // if destination document does not already exist, we will look for a legacy document to migrate
  let dataToMigrate: OpportunityUpdateWithForm<Record<string, any>> | undefined;
  if (!(await getDoc(updateDocRef)).exists()) {
    const { docRef: v2UpdatesDocRef, oldDocument: v1UpdatesDoc } =
      await getClientUpdatesV2DocRef(db, clientId, clientRecordId);

    // legacy format(s): object nested directly in the update doc
    let legacyRecord = v1UpdatesDoc;
    // this doc will only be returned if the v2 doc does not exist
    if (!v1UpdatesDoc) {
      legacyRecord = (await getDoc(v2UpdatesDocRef)).data();
    }

    dataToMigrate = legacyRecord?.[opportunityType];
  }

  if (dataToMigrate) {
    // write old + new data to new destination
    // eslint-disable-next-line no-restricted-syntax
    setDoc(updateDocRef, dataToMigrate);
  }
}

export class OpportunityUpdateSubscription<
  RecordType extends OpportunityUpdate
> extends CollectionDocumentSubscription<RecordType> {
  // needs to be redefined because it's read-only but otherwise unchanged
  readonly dataSource: DocumentReference<RecordType>;

  opportunityType: OpportunityType;

  constructor(
    firestoreStore: FirestoreStore,
    clientRecordId: string,
    clientId: string,
    opportunityType: OpportunityType
  ) {
    const collectionName = "clientUpdatesV2";
    super(firestoreStore, collectionName, clientRecordId);

    this.dataSource = doc(
      firestoreStore.db,
      collectionNames[collectionName],
      clientRecordId,
      collectionNames.clientOpportunityUpdates,
      opportunityType
    ) as DocumentReference<RecordType>;

    this.opportunityType = opportunityType;

    if (firestoreStore.rootStore.isImpersonating) return;
    // TODO(#2108): remove the in-place migration once all legacy data is moved over
    migrateOpportunityUpdate(
      firestoreStore.db,
      this.dataSource,
      clientId,
      clientRecordId,
      opportunityType
    );
  }
}
