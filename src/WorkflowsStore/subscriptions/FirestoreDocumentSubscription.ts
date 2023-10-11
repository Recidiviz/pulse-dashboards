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

import { FeatureGateError } from "../../errors";
import { castToError } from "../../utils/castToError";
import {
  DocumentSubscription,
  TransformFunction,
  UpdateFunction,
  ValidateFunction,
} from "./types";
import {
  defaultTransformFunction,
  defaultUpdateFunction,
  defaultValidateFunction,
} from "./utils";

export abstract class FirestoreDocumentSubscription<
  DataFormat extends DocumentData = DocumentData
> implements DocumentSubscription<DataFormat>
{
  /**
   * Observable handle for fetched data. Always holds the most recently fetched data,
   * which may become stale while the subscription is inactive.
   */
  data: DataFormat | undefined;

  abstract readonly dataSource: DocumentReference;

  cancelSnapshotListener?: Unsubscribe;

  transformRecord: TransformFunction<DataFormat>;

  validateRecord: ValidateFunction<DataFormat>;

  updateRecord: UpdateFunction<DocumentData>;

  constructor(
    transformFunction: TransformFunction<DataFormat> = defaultTransformFunction,
    validateFunction: ValidateFunction<DataFormat> = defaultValidateFunction,
    updateFunction: UpdateFunction<DocumentData> = defaultUpdateFunction
  ) {
    // default passes through raw record, assuming it already conforms to the desired format
    this.transformRecord = transformFunction;

    this.validateRecord = validateFunction;

    this.updateRecord = updateFunction;

    // note that dataSource is not observable by default.
    // in the base case there is really no need for it
    makeObservable<this, "updateData">(this, {
      data: observable.struct,
      updateData: action,
      hydrate: action,
      subscribe: action,
      isLoading: observable,
      error: observable,
      isHydrated: observable,
      setError: action,
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
   * Validates the record and does not set `this.data` property if the result
   * fails validation.
   */
  updateData(snapshot: DocumentSnapshot): void {
    try {
      this.updateRecord(snapshot.data({ serverTimestamps: "estimate" }));

      const record = this.transformRecord(
        snapshot.data({ serverTimestamps: "estimate" })
      );

      if (record !== undefined) this.validateRecord(record);

      this.data = record;
      this.isHydrated = true;
      this.error = undefined;
    } catch (e) {
      this.setError(castToError(e));
      // don't log routine feature flag checks, but do log everything else
      if (!(e instanceof FeatureGateError)) {
        Sentry.captureException(e);
      }
    }

    if (this.isLoading) {
      this.isLoading = false;
    }
  }

  /**
   * Sets all hydration properties as needed to represent an error state.
   * Error and hydrated states are mutually exclusive for this class!
   */
  setError(e: Error): void {
    this.error = e;
    this.data = undefined;
    this.isHydrated = false;
    this.isLoading = false;
  }

  get isActive(): boolean {
    return this.cancelSnapshotListener !== undefined;
  }

  /**
   * Activates a listener on `this.dataSource`. Safe to call repeatedly: it will not
   * create a redundant listener if one is already active.
   */
  subscribe(): void {
    if (this.isActive || this.isLoading) return;

    if (this.isLoading === undefined) {
      this.isLoading = true;
    }

    this.cancelSnapshotListener = onSnapshot(
      this.dataSource,
      (result) => this.updateData(result),
      (error) => {
        this.setError(error);
        Sentry.captureException(error);
      }
    );
  }

  isLoading: boolean | undefined = undefined;

  error: Error | undefined = undefined;

  isHydrated = false;

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
