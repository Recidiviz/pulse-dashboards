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

import {
  DocumentData,
  FieldPath,
  Query,
  query,
  where,
} from "firebase/firestore";
import { z } from "zod";

import { FirestoreCollectionKey } from "~firestore-api";

import { WorkflowsStore } from "../WorkflowsStore";
import { FirestoreQuerySubscription } from "./FirestoreQuerySubscription";

export class CaseloadSubscription<
  RecordType extends DocumentData,
> extends FirestoreQuerySubscription<RecordType> {
  workflowsStore: WorkflowsStore;

  firestoreCollectionKey: FirestoreCollectionKey;

  personType: RecordType["personType"];

  constructor(
    workflowsStore: WorkflowsStore,
    firestoreCollectionKey: FirestoreCollectionKey,
    personType: RecordType["personType"],
    parser?: z.ZodType<RecordType, any, any>,
  ) {
    parser ? super(parser.parse) : super();
    this.workflowsStore = workflowsStore;
    this.firestoreCollectionKey = firestoreCollectionKey;
    this.personType = personType;
  }

  get dataSource(): Query | undefined {
    const {
      selectedSearchIds,
      rootStore: { currentTenantId, firestoreStore },
    } = this.workflowsStore;

    if (!currentTenantId || !selectedSearchIds.length) {
      return undefined;
    }

    const { firestoreCollectionKey, personType } = this;

    const config = this.workflowsStore.systemConfigFor(
      personType === "RESIDENT" ? "INCARCERATION" : "SUPERVISION",
    );

    const constraints = [
      where("stateCode", "==", currentTenantId),
      where(
        new FieldPath(...config.searchField),
        config.searchOp ?? "in",
        selectedSearchIds,
      ),
    ];

    if (config.onlySurfaceEligible) {
      constraints.push(where("allEligibleOpportunities", "!=", []));
    }

    return query(
      firestoreStore.collection(firestoreCollectionKey),
      ...constraints,
    ).withConverter({
      fromFirestore(snapshot, options) {
        const doc = snapshot.data(options);
        return { ...doc, recordId: snapshot.id, personType };
      },
      // these collections are read-only, so this should never be used, but it is required by Firestore
      toFirestore(record: any) {
        throw new Error(`Writing to ${firestoreCollectionKey} is not allowed`);
      },
    });
  }
}
