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
  collection,
  DocumentData,
  Query,
  query,
  where,
} from "firebase/firestore";

import { CollectionName, collectionNames } from "../../FirestoreStore";
import { WorkflowsStore } from "../WorkflowsStore";
import { FirestoreQuerySubscription } from "./FirestoreQuerySubscription";

export class CaseloadSubscription<
  RecordType extends DocumentData
> extends FirestoreQuerySubscription<RecordType> {
  workflowsStore: WorkflowsStore;

  collectionId: string;

  personType: RecordType["personType"];

  constructor(
    workflowsStore: WorkflowsStore,
    collectionKey: CollectionName,
    personType: RecordType["personType"]
  ) {
    super();
    this.workflowsStore = workflowsStore;
    this.collectionId = collectionNames[collectionKey];
    this.personType = personType;
  }

  get dataSource(): Query | undefined {
    const {
      selectedOfficerIds,
      rootStore: { currentTenantId, firestoreStore },
    } = this.workflowsStore;

    if (!currentTenantId || !selectedOfficerIds.length) {
      return undefined;
    }

    const { collectionId, personType } = this;
    return query(
      collection(firestoreStore.db, collectionId),
      where("stateCode", "==", currentTenantId),
      where("officerId", "in", selectedOfficerIds)
    ).withConverter({
      fromFirestore(snapshot, options) {
        const doc = snapshot.data(options);
        return { ...doc, recordId: snapshot.id, personType };
      },
      // these collections are read-only, so this should never be used, but it is required by Firestore
      toFirestore(record: any) {
        throw new Error(`Writing to ${collectionId} is not allowed`);
      },
    });
  }
}
