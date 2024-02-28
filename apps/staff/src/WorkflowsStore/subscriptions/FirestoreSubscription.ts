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

import { Unsubscribe } from "firebase/firestore";
import { defer } from "lodash";
import {
  action,
  computed,
  makeObservable,
  observable,
  onBecomeObserved,
  onBecomeUnobserved,
} from "mobx";
import { Annotation } from "mobx/dist/internal";

import { Hydratable, HydrationState } from "../../core/models/types";
import {
  isHydrationInProgress,
  isHydrationUntouched,
} from "../../core/models/utils";

/**
 * Base class that includes common behavior for integrating with Firestore
 * and maps subscription states to the Hydratable interface. Subclasses are
 * responsible for defining the data source and handling the actual data (including
 * setting the terminal hydration states on receipt of data or error from the listener)
 */
export abstract class FirestoreSubscription<DataFormat> implements Hydratable {
  protected cancelSnapshotListener?: Unsubscribe;

  /**
   * This method should implement the actual logic of subscribing to a particular Firestore
   * data source, and return the `Unsubscribe` function returned by Firestore's `onSnapshot`.
   *
   * Method can return undefined because there are rare cases where subscriptions may
   * need to bail out of listening for snapshots and serve other data, e.g. from a local override.
   */
  protected abstract startSnapshotListener(): Unsubscribe | undefined;

  constructor(
    /**
     * Always holds the most recently fetched data, which may become stale
     * while the subscription is inactive.
     */

    public data: DataFormat,
    dataAnnotation: Annotation = observable,
  ) {
    makeObservable<this, "cancelSnapshotListener">(this, {
      cancelSnapshotListener: observable,
      data: dataAnnotation,
      hydrate: action,
      hydrationState: observable,
      isActive: computed,
      subscribe: action,
      unsubscribe: action,
    });

    this.makeSubscriptionsReactive();
  }

  /**
   * Automatically (un)subscribes to Firestore based on whether any MobX
   * observers are actually watching for subscription data on this object.
   * They run async in case they cause state updates to avoid render disruptions.
   */
  protected makeSubscriptionsReactive() {
    onBecomeObserved(this, "data", () => defer(() => this.subscribe()));
    // this has the additional effect of preventing orphaned listeners
    // if this object gets garbage collected, since it should also become unobserved
    // at or before that point
    onBecomeUnobserved(this, "data", () => defer(() => this.unsubscribe()));
  }

  get isActive(): boolean {
    return this.cancelSnapshotListener !== undefined;
  }

  /**
   * Activates the snapshot listener, if necessary. Safe to call repeatedly: it will not
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

    // if we are loading "in the background" (i.e. some amount of hydration has already happened)
    // we don't want to suddenly flip back into a loading state, which is why this is conditional
    if (isHydrationUntouched(this)) {
      this.hydrationState = { status: "loading" };
    }

    this.cancelSnapshotListener = this.startSnapshotListener();
  }

  /**
   * Cancels the snapshot listener and resets it, so we can create another one later if necessary.
   * Generally leaves the hydration state as-is, except to prevent an infinite loading state.
   */
  unsubscribe(): void {
    // if we are unsubscribing before receiving any data, ensure that we
    // return to the initial hydration state. Otherwise leave it as is
    if (isHydrationInProgress(this)) {
      this.hydrationState = { status: "needs hydration" };
    }

    this.cancelSnapshotListener?.();
    this.cancelSnapshotListener = undefined;
  }

  hydrate(): void {
    this.subscribe();
  }

  hydrationState: HydrationState = { status: "needs hydration" };
}
