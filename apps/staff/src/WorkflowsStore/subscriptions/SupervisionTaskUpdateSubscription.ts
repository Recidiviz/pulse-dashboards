// Recidiviz - a data platform for criminal justice reform
// Copyright (C) 2023 Recidiviz, Inc.
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

import { DocumentReference } from "firebase/firestore";

import FirestoreStore, { SupervisionTaskUpdate } from "../../FirestoreStore";
import { FIRESTORE_GENERAL_COLLECTION_MAP } from "../../FirestoreStore/constants";
import { CollectionDocumentSubscription } from "./CollectionDocumentSubscription";

export class SupervisionTaskUpdateSubscription<
  RecordType extends SupervisionTaskUpdate,
> extends CollectionDocumentSubscription<RecordType> {
  // needs to be redefined because it's read-only but otherwise unchanged
  readonly dataSource: DocumentReference<RecordType>;

  constructor(firestoreStore: FirestoreStore, recordId: string) {
    const firestoreCollectionKey = { key: "clientUpdatesV2" } as const;
    super(firestoreStore, firestoreCollectionKey, recordId);

    this.dataSource = firestoreStore.doc(
      firestoreCollectionKey,
      recordId,
      FIRESTORE_GENERAL_COLLECTION_MAP.taskUpdates,
      "supervision",
    ) as DocumentReference<RecordType>;
  }
}
