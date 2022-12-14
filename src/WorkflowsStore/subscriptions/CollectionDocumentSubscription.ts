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

import { doc, DocumentData, DocumentReference } from "firebase/firestore";

import { CollectionName, collectionNames, db } from "../../firestore";
import { FirestoreDocumentSubscription } from "./FirestoreDocumentSubscription";
import { TransformFunction, ValidateFunction } from "./types";

/**
 * Subscribes to the specified document in the specified collection.
 * RecordType is essentially just an assertion for downstream convenience;
 * the data source itself is not validated or even strongly typed. Proceed with caution!
 */
export class CollectionDocumentSubscription<
  RecordType extends DocumentData
> extends FirestoreDocumentSubscription<RecordType> {
  readonly dataSource: DocumentReference;

  constructor(
    collectionName: CollectionName,
    recordId: string,
    transformFn?: TransformFunction<RecordType>,
    validateFn?: ValidateFunction<RecordType>
  ) {
    super(transformFn, validateFn);

    this.dataSource = doc(db, collectionNames[collectionName], recordId);
  }
}
