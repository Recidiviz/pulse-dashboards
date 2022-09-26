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
  DocumentData,
  DocumentReference,
  DocumentSnapshot,
  onSnapshot,
  Unsubscribe,
} from "firebase/firestore";
import {
  action,
  makeObservable,
  observable,
  onBecomeObserved,
  onBecomeUnobserved,
} from "mobx";

import { DocumentSubscription, TransformFunction } from "./types";

export abstract class FirestoreDocumentSubscription<
  DataFormat extends DocumentData = DocumentData
> implements DocumentSubscription<DataFormat> {
  /**
   * Observable handle for fetched data. Always holds the most recently fetched data,
   * which may become stale while the subscription is inactive.
   */
  data: DataFormat | undefined;

  abstract readonly dataSource: DocumentReference;

  cancelSnapshotListener?: Unsubscribe;

  transformRecord: TransformFunction<DataFormat>;

  constructor(transformFunction?: TransformFunction<DataFormat>) {
    // default passes through raw record, assuming it already conforms to the desired format
    this.transformRecord =
      transformFunction ?? ((d) => (d as DataFormat) ?? undefined);

    // note that dataSource is not observable by default.
    // in the base case there is really no need for it
    makeObservable<this, "updateData">(this, {
      data: observable.struct,
      updateData: action,
      hydrate: action,
      subscribe: action,
      isLoading: observable,
      error: observable,
    });

    // these automatically stop/start the listener based on whether any MobX
    // observers are actually watching for subscription data on this object
    onBecomeObserved(this, "data", () => this.subscribe());
    // this has the additional effect of preventing orphaned listeners
    // if this object gets garbage collected, since it should also become unobserved
    // at or before that point
    onBecomeUnobserved(this, "data", () => this.unsubscribe());
  }

  /**
   * Stores data on the observable `this.data` property. Mainly intended
   * to be used by the callback for the listener created by `this.subscribe`.
   */
  updateData(snapshot: DocumentSnapshot): void {
    this.data = this.transformRecord(
      snapshot.data({ serverTimestamps: "estimate" })
    );

    if (this.isLoading) {
      this.isLoading = false;
    }
  }

  get isActive(): boolean {
    return this.cancelSnapshotListener !== undefined;
  }

  /**
   * Activates a listener on `this.dataSource`. Safe to call repeatedly: it will not
   * create a redundant listener if one is already active.
   */
  subscribe(): void {
    if (this.isActive) return;

    if (this.isLoading === undefined) {
      this.isLoading = true;
    }

    this.cancelSnapshotListener = onSnapshot(this.dataSource, (result) =>
      this.updateData(result)
    );
  }

  isLoading: boolean | undefined = undefined;

  error: Error | undefined = undefined;

  hydrate(): void {
    this.subscribe();
  }

  /**
   * Cancels the listener on `this.dataSource`.
   */
  unsubscribe(): void {
    this.cancelSnapshotListener?.();
    this.cancelSnapshotListener = undefined;
  }
}
