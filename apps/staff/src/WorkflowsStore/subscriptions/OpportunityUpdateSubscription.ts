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

import { DocumentData, DocumentReference } from "firebase/firestore";

import { FIRESTORE_GENERAL_COLLECTION_MAP } from "~firestore-api";

import FirestoreStore, { OpportunityUpdate } from "../../FirestoreStore";
import { OpportunityType } from "../Opportunity/OpportunityType/types";
import { CollectionDocumentSubscription } from "./CollectionDocumentSubscription";
import { UpdateFunction } from "./types";

export class OpportunityUpdateSubscription<
  RecordType extends OpportunityUpdate,
> extends CollectionDocumentSubscription<RecordType> {
  // needs to be redefined because it's read-only but otherwise unchanged
  readonly dataSource: DocumentReference<RecordType>;

  opportunityType: OpportunityType;

  constructor(
    firestoreStore: FirestoreStore,
    clientRecordId: string,
    opportunityType: OpportunityType,
    updateOpportunityEligibility: UpdateFunction<DocumentData>,
  ) {
    const firestoreCollectionKey = { key: "clientUpdatesV2" } as const;

    super(
      firestoreStore,
      firestoreCollectionKey,
      clientRecordId,
      undefined, // transformFn
      undefined, // validateFn
      updateOpportunityEligibility,
    );

    this.dataSource = firestoreStore.doc(
      firestoreCollectionKey,
      clientRecordId,
      FIRESTORE_GENERAL_COLLECTION_MAP.clientOpportunityUpdates,
      opportunityType,
    ) as DocumentReference<RecordType>;

    this.opportunityType = opportunityType;
  }
}
