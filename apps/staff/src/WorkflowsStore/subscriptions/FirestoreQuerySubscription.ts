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
  override,
  reaction,
  runInAction,
} from "mobx";
import { IDisposer } from "mobx-utils";

import { FeatureGateError } from "../../errors";
import { FirestoreSubscription } from "./FirestoreSubscription";
import {
  QuerySubscription,
  TransformFunction,
  ValidateFunction,
} from "./types";
import { defaultTransformFunction, defaultValidateFunction } from "./utils";

export abstract class FirestoreQuerySubscription<
    DataFormat extends DocumentData,
  >
  extends FirestoreSubscription<DataFormat[]>
  implements QuerySubscription<DataFormat>
{
  abstract get dataSource(): Query | undefined;

  protected disposeDynamicDataSource?: IDisposer;

  constructor(
    protected transformRecord: TransformFunction<DataFormat> = defaultTransformFunction,
    protected validateRecord: ValidateFunction<DataFormat> = defaultValidateFunction,
  ) {
    super([]);

    makeObservable<this, "updateData">(this, {
      dataSource: computed,
      updateData: action,
      subscribe: override,
      unsubscribe: override,
    });
  }

  protected updateData(snapshot: QuerySnapshot | undefined): void {
    const docs: DataFormat[] = [];

    // receiving no snapshot at all is a special case that indicates there is no valid data source;
    // when this happens we want to reset the hydration state in addition to clearing out any data
    // that may already exist from previous updates
    if (!snapshot) {
      this.data = docs;
      this.hydrationState = { status: "needs hydration" };
      return;
    }

    const errors: unknown[] = [];

    snapshot.forEach((doc) => {
      try {
        const record = this.transformRecord(
          doc.data({ serverTimestamps: "estimate" }),
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

  protected startSnapshotListener(): Unsubscribe | undefined {
    if (!this.dataSource) {
      this.updateData(undefined);
    } else {
      return onSnapshot(
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
        },
      );
    }
  }

  subscribe(): void {
    super.subscribe();

    // watches dataSource for changes and re-subscribes accordingly
    this.disposeDynamicDataSource = reaction(
      () => this.dataSource,
      () => {
        this.unsubscribe();
        this.subscribe();
      },
    );
  }

  unsubscribe(): void {
    super.unsubscribe();
    this.disposeDynamicDataSource?.();
  }
}
