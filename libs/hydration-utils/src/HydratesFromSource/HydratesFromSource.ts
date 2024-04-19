// Recidiviz - a data platform for criminal justice reform
// Copyright (C) 2023 Recidiviz, Inc.
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
import { makeAutoObservable } from "mobx";

import { Hydratable, HydrationState } from "../Hydratable/types";
import { isHydrated, isHydrationInProgress } from "../Hydratable/utils";
import { castToError } from "../utils/castToError";

type HydrationSource = {
  /**
   * Functions in this array should throw an error useful for debugging
   * when the underlying source is not populated
   */
  expectPopulated: Array<() => void>;
  /**
   * hydrate() will call this. Any errors it throws will bubble up to the caller of hydrate()
   */
  populate: () => Promise<void>;
};

/**
 * Implements a common hydration pattern for presenters:
 * - data is hydrated from a pre-existing source object, which may already
 *   be populated at construction time
 * - if not populated, this class calls populator methods on the source object
 *   and updates its own hydration status based on the progress of the populators
 */
export class HydratesFromSource implements Hydratable {
  constructor(public source: HydrationSource) {
    makeAutoObservable(this);
  }

  private hydrationStateOverride?: HydrationState;

  /**
   * Calls all expectation functions on `this.source`. If any of them throw,
   * it will catch them and rethrow a single AggregateError that includes all caught errors.
   */
  private aggregateExpectPopulated(): void {
    const errors: Array<unknown> = [];
    this.source.expectPopulated.forEach((fn) => {
      try {
        fn();
      } catch (e) {
        errors.push(e);
      }
    });

    if (errors.length) {
      throw new AggregateError(errors, "Expected data failed to populate");
    }
  }

  private isSourcePopulated(): boolean {
    try {
      this.aggregateExpectPopulated();
      return true;
    } catch {
      return false;
    }
  }

  get hydrationState(): HydrationState {
    if (this.hydrationStateOverride) {
      return this.hydrationStateOverride;
    }
    if (this.isSourcePopulated()) {
      return { status: "hydrated" };
    }
    return { status: "needs hydration" };
  }

  setHydrationStateOverride(state: HydrationState | undefined) {
    this.hydrationStateOverride = state;
  }

  async hydrate(): Promise<void> {
    if (isHydrated(this) || isHydrationInProgress(this)) return;

    this.setHydrationStateOverride({ status: "loading" });

    try {
      await this.source.populate();
      this.aggregateExpectPopulated();
      this.setHydrationStateOverride({ status: "hydrated" });
    } catch (e) {
      this.setHydrationStateOverride({
        status: "failed",
        error: castToError(e),
      });
      Sentry.captureException(e);
    }
  }
}
