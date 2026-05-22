// Recidiviz - a data platform for criminal justice reform
// Copyright (C) 2026 Recidiviz, Inc.
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

import { Query, query, where } from "firebase/firestore";

import FirestoreStore, {
  CustomTaskRecord,
  customTaskSchema,
} from "../../FirestoreStore";
import { FirestoreQuerySubscription } from "./FirestoreQuerySubscription";

/**
 * Subscribes to the `clientUpdatesV2/{recordId}/custom_tasks` subcollection.
 * Soft-deleted tasks are filtered out server-side via
 * `where("deletedOn", "==", null)` — a single-field filter that Firestore
 * indexes automatically, so no composite index is required. Records that fail
 * `customTaskSchema.parse` are dropped (and reported to Sentry) by the parent
 * `FirestoreQuerySubscription.updateData` so a single malformed doc does not
 * poison the whole subscription.
 */
export class CustomTasksSubscription extends FirestoreQuerySubscription<CustomTaskRecord> {
  private firestoreStore: FirestoreStore;

  private recordId: string;

  constructor(firestoreStore: FirestoreStore, recordId: string) {
    super(undefined, (record) => {
      customTaskSchema.parse(record);
    });
    this.firestoreStore = firestoreStore;
    this.recordId = recordId;
  }

  get dataSource(): Query | undefined {
    return query(
      this.firestoreStore.customTasksCollection(this.recordId),
      where("deletedOn", "==", null),
    );
  }
}
