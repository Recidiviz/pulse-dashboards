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
import { action, makeObservable, observable, runInAction } from "mobx";

import { FeatureGateError } from "../../errors";
import { castToError } from "../../utils/castToError";
import { FirestoreSubscription } from "./FirestoreSubscription";
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
  >
  extends FirestoreSubscription<DataFormat | undefined>
  implements DocumentSubscription<DataFormat>
{
  abstract readonly dataSource: DocumentReference;

  constructor(
    // default passes through raw record, assuming it already conforms to the desired format
    protected transformRecord: TransformFunction<DataFormat> = defaultTransformFunction,
    protected validateRecord: ValidateFunction<DataFormat> = defaultValidateFunction,
    protected updateRecord: UpdateFunction<DocumentData> = defaultUpdateFunction
  ) {
    super(undefined, observable.struct);

    // note that dataSource is not observable by default.
    // in the base case there is really no need for it
    makeObservable<this, "updateData">(this, {
      updateData: action,
    });
  }

  /**
   * Stores data on the observable `this.data` property. Mainly intended
   * to be used by the callback for the listener created by `this.subscribe`.
   * Validates the record and does not set `this.data` property if the result
   * fails validation.
   */
  protected updateData(snapshot: DocumentSnapshot): void {
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

  protected startSnapshotListener(): Unsubscribe | undefined {
    return onSnapshot(
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
}
