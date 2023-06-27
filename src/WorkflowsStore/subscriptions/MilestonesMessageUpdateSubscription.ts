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

import { startOfToday } from "date-fns";
import { doc, DocumentReference } from "firebase/firestore";

import FirestoreStore, {
  collectionNames,
  MilestonesMessage,
} from "../../FirestoreStore";
import { getMonthYearFromDate } from "../utils";
import { CollectionDocumentSubscription } from "./CollectionDocumentSubscription";

export class MilestonesMessageUpdateSubscription<
  RecordType extends MilestonesMessage
> extends CollectionDocumentSubscription<RecordType> {
  // needs to be redefined because it's read-only but otherwise unchanged
  readonly dataSource: DocumentReference<RecordType>;

  constructor(firestoreStore: FirestoreStore, recordId: string) {
    const collectionName = "clientUpdatesV2";
    super(firestoreStore, collectionName, recordId);
    const dateKey = getMonthYearFromDate(startOfToday());

    this.dataSource = doc(
      firestoreStore.db,
      collectionNames[collectionName],
      recordId,
      collectionNames.milestonesMessages,
      dateKey
    ) as DocumentReference<RecordType>;
  }
}
