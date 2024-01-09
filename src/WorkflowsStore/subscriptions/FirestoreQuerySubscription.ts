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
import { defer } from "lodash";
import {
  action,
  computed,
  makeObservable,
  observable,
  onBecomeObserved,
  onBecomeUnobserved,
  reaction,
  runInAction,
} from "mobx";
import { IDisposer } from "mobx-utils";

import { HydrationState } from "../../core/models/types";
import { isHydrationInProgress } from "../../core/models/utils";
import { FeatureGateError } from "../../errors";
import {
  QuerySubscription,
  TransformFunction,
  ValidateFunction,
} from "./types";
import { defaultTransformFunction, defaultValidateFunction } from "./utils";

export abstract class FirestoreQuerySubscription<
  DataFormat extends DocumentData
> implements QuerySubscription<DataFormat>
{
  data: DataFormat[] = [];

  abstract get dataSource(): Query | undefined;

  cancelSnapshotListener?: Unsubscribe;

  disposeDynamicDataSource?: IDisposer;

  transformRecord: TransformFunction<DataFormat>;

  validateRecord: ValidateFunction<DataFormat>;

  constructor(
    transformFunction: TransformFunction<DataFormat> = defaultTransformFunction,
    validateFunction: ValidateFunction<DataFormat> = defaultValidateFunction
  ) {
    makeObservable<this, "updateData">(this, {
      data: observable,
      dataSource: computed,
      updateData: action,
      subscribe: action,
      unsubscribe: action,
      resetHydration: action,
      hydrate: action,
      hydrationState: observable,
    });

    this.transformRecord = transformFunction;

    this.validateRecord = validateFunction;

    // run side effects async in case they cause state updates, to avoid render disruptions
    onBecomeObserved(this, "data", () => defer(() => this.subscribe()));
    onBecomeUnobserved(this, "data", () => defer(() => this.unsubscribe()));
  }

  protected updateData(snapshot: QuerySnapshot | undefined): void {
    const docs: DataFormat[] = [];

    const errors: unknown[] = [];

    snapshot?.forEach((doc) => {
      try {
        const record = this.transformRecord(
          doc.data({ serverTimestamps: "estimate" })
        );

        if (record !== undefined) this.validateRecord(record);

        if (record !== undefined) {
          docs.push(record);
        }
      } catch (e) {
        // Move on to allow for partial success
        errors.push(e);
        // don't log routine feature flag checks, but do log everything else
        if (!(e instanceof FeatureGateError)) {
          Sentry.captureException(e);
        }
      }
    });

    this.data = docs;
    // regardless of errors we always consider this hydrated
    this.hydrationState = { status: "hydrated" };
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

    this.hydrationState = { status: "loading" };

    if (!this.dataSource) {
      this.updateData(undefined);
    } else {
      this.cancelSnapshotListener = onSnapshot(
        this.dataSource,
        (result) => this.updateData(result),
        (error) => {
          runInAction(() => {
            // an error that occurs after data is fetched is considered a partial failure,
            // but this one means that the fetch operation itself failed and therefore so does hydration.
            this.hydrationState = { status: "failed", error };
            this.data = [];
          });
          Sentry.captureException(error);
        }
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
    // if we are unsubscribing before receiving any data, ensure that we
    // return to the initial hydration state. Otherwise leave it as is
    if (isHydrationInProgress(this)) {
      this.resetHydration();
    }
    this.cancelSnapshotListener?.();
    this.cancelSnapshotListener = undefined;
    this.disposeDynamicDataSource?.();
  }

  hydrate(): void {
    this.subscribe();
  }

  hydrationState: HydrationState = { status: "needs hydration" };

  resetHydration(): void {
    this.hydrationState = { status: "needs hydration" };
  }
}
