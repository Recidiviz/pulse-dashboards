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

import * as Sentry from "@sentry/react";
import {
  DocumentData,
  onSnapshot,
  Query,
  QuerySnapshot,
  Unsubscribe,
} from "firebase/firestore";
import {
  action,
  computed,
  makeObservable,
  observable,
  onBecomeObserved,
  onBecomeUnobserved,
  reaction,
} from "mobx";
import { IDisposer } from "mobx-utils";

import {
  QuerySubscription,
  TransformFunction,
  ValidateFunction,
} from "./types";

export abstract class FirestoreQuerySubscription<
  DataFormat extends DocumentData
> implements QuerySubscription<DataFormat> {
  data: DataFormat[] = [];

  abstract get dataSource(): Query | undefined;

  cancelSnapshotListener?: Unsubscribe;

  disposeDynamicDataSource?: IDisposer;

  transformRecord: TransformFunction<DataFormat>;

  validateRecord: ValidateFunction<DocumentData>;

  constructor(
    transformFunction?: TransformFunction<DataFormat>,
    validateFunction?: ValidateFunction<DocumentData>
  ) {
    makeObservable<this, "updateData">(this, {
      data: observable,
      dataSource: computed,
      updateData: action,
      isLoading: observable,
      isHydrated: observable,
      error: observable,
      subscribe: action,
      resetHydration: action,
    });

    // defaults pass through raw data, assuming it already conforms to the desired format
    this.transformRecord =
      transformFunction ?? ((d) => (d as DataFormat) ?? undefined);

    this.validateRecord = validateFunction ?? ((d) => d as DocumentData);

    onBecomeObserved(this, "data", () => this.subscribe());
    onBecomeUnobserved(this, "data", () => this.unsubscribe());
  }

  protected updateData(snapshot: QuerySnapshot | undefined): void {
    const docs: DataFormat[] = [];

    const errors: unknown[] = [];

    snapshot?.forEach((doc) => {
      try {
        const record = this.validateRecord(
          this.transformRecord(doc.data({ serverTimestamps: "estimate" }))
        ) as DataFormat;
        if (record) {
          docs.push(record);
        }
      } catch (e) {
        // Move on to allow for partial success
        errors.push(e);
        Sentry.captureException(e);
      }
    });

    this.data = docs;
    this.error = errors.length ? new AggregateError(errors) : undefined;

    this.isHydrated = true;
    this.isLoading = false;
  }

  get isActive(): boolean {
    return this.cancelSnapshotListener !== undefined;
  }

  subscribe(): void {
    // `subscribe`, on its own, will not re-subscribe if a listener already exists;
    // replacing the subscription with a new one requires further orchestration,
    // as seen in the reaction defined below.
    if (this.isActive || this.isLoading) return;

    this.isLoading = true;

    if (!this.dataSource) {
      this.updateData(undefined);
    } else {
      this.cancelSnapshotListener = onSnapshot(this.dataSource, (result) =>
        this.updateData(result)
      );
    }

    // watches dataSource for changes and re-subscribes accordingly
    this.disposeDynamicDataSource = reaction(
      () => this.dataSource,
      () => {
        this.unsubscribe();
        this.resetHydration();
        this.subscribe();
      }
    );
  }

  unsubscribe(): void {
    this.cancelSnapshotListener?.();
    this.cancelSnapshotListener = undefined;
    this.disposeDynamicDataSource?.();
  }

  hydrate(): void {
    this.subscribe();
  }

  isLoading: boolean | undefined = undefined;

  error: Error | undefined = undefined;

  isHydrated = false;

  resetHydration(): void {
    this.isLoading = false;
    this.isHydrated = false;
    this.error = undefined;
  }
}