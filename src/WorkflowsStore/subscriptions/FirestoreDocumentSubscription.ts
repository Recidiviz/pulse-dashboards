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
import { defer } from "lodash";
import {
  action,
  makeObservable,
  observable,
  onBecomeObserved,
  onBecomeUnobserved,
  runInAction,
} from "mobx";

import { HydrationState } from "../../core/models/types";
import {
  isHydrationInProgress,
  isHydrationUntouched,
} from "../../core/models/utils";
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
      hydrationState: observable,
      subscribe: action,
    });

    // these automatically stop/start the listener based on whether any MobX
    // observers are actually watching for subscription data on this object.
    // they run async in case they cause state updates to avoid render disruptions
    onBecomeObserved(this, "data", () => defer(() => this.subscribe()));
    // this has the additional effect of preventing orphaned listeners
    // if this object gets garbage collected, since it should also become unobserved
    // at or before that point
    onBecomeUnobserved(this, "data", () => defer(() => this.unsubscribe()));
  }

  /**
   * Stores data on the observable `this.data` property. Mainly intended
   * to be used by the callback for the listener created by `this.subscribe`.
   * Validates the record and does not set `this.data` property if the result
   * fails validation.
   */
  updateData(snapshot: DocumentSnapshot): void {
    try {
      const snapshotData = snapshot.data({ serverTimestamps: "estimate" });

      if (!snapshotData) {
        this.data = undefined;
        this.hydrationState = { status: "hydrated" };
        return;
      }

      this.updateRecord(snapshotData);

      const record = this.transformRecord(snapshotData);

      if (record !== undefined) this.validateRecord(record);

      this.data = record;
      this.hydrationState = { status: "hydrated" };
    } catch (e) {
      this.hydrationState = { status: "failed", error: castToError(e) };
      this.data = undefined;
      // don't log routine feature flag checks, but do log everything else
      if (!(e instanceof FeatureGateError)) {
        Sentry.captureException(e);
      }
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
    if (
      this.isActive ||
      // if the subscription is inactive, we will rehydrate if we're already hydrated
      // or failed. This is different from fetch-based hydration flows
      isHydrationInProgress(this)
    )
      return;

    if (isHydrationUntouched(this)) {
      this.hydrationState = { status: "loading" };
    }
    this.cancelSnapshotListener = onSnapshot(
      this.dataSource,
      (result) => this.updateData(result),
      (error) => {
        runInAction(() => {
          this.hydrationState = { status: "failed", error };
        });
        Sentry.captureException(error);
      }
    );
  }

  hydrationState: HydrationState = { status: "needs hydration" };

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
