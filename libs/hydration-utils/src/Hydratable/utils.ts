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

import assertNever from "assert-never";
import { identity, isError } from "lodash";

import { Hydratable, HydrationState } from "./types";

/**
 * Returns true if hydration has reached any terminal state and false otherwise.
 */
export function isHydrationFinished(hydratable: Hydratable): boolean {
  switch (hydratable.hydrationState.status) {
    case "hydrated":
    case "failed":
      return true;
    case "loading":
    case "needs hydration":
      return false;
    default:
      assertNever(hydratable.hydrationState);
  }
}

/**
 * Returns true if hydration has reached a successful terminal state and false otherwise.
 */
export function isHydrated(hydratable: Hydratable): boolean {
  switch (hydratable.hydrationState.status) {
    case "hydrated":
      return true;
    case "failed":
    case "loading":
    case "needs hydration":
      return false;
    default:
      assertNever(hydratable.hydrationState);
  }
}

/**
 * Returns true if hydration has started but not reached a terminal state, false otherwise.
 */
export function isHydrationInProgress(hydratable: Hydratable): boolean {
  switch (hydratable.hydrationState.status) {
    case "loading":
      return true;
    case "hydrated":
    case "failed":
    case "needs hydration":
      return false;
    default:
      assertNever(hydratable.hydrationState);
  }
}

/**
 * Returns true if hydration is neither in progress nor completed, false otherwise.
 */
export function isHydrationUntouched(hydratable: Hydratable): boolean {
  switch (hydratable.hydrationState.status) {
    case "needs hydration":
      return true;
    case "loading":
    case "hydrated":
    case "failed":
      return false;
    default:
      assertNever(hydratable.hydrationState);
  }
}

/**
 * Returns true if hydration is in progress or finished, false otherwise.
 */
export function isHydrationStarted(hydratable: Hydratable): boolean {
  switch (hydratable.hydrationState.status) {
    case "needs hydration":
      return false;
    case "loading":
    case "hydrated":
    case "failed":
      return true;
    default:
      assertNever(hydratable.hydrationState);
  }
}

/**
 * Returns the associated error if hydration has failed
 */
export function hydrationFailure(hydratable: Hydratable): Error | undefined {
  switch (hydratable.hydrationState.status) {
    case "failed":
      return hydratable.hydrationState.error;
    case "loading":
    case "hydrated":
    case "needs hydration":
      return;
    default:
      assertNever(hydratable.hydrationState);
  }
}

/**
 * Computes a lowest-common-denominator state based on the passed-in objects, with a failure
 * in any of them taking precedence over all other possible states.
 */
export function compositeHydrationState(
  hydratables: Array<Hydratable>,
): HydrationState {
  const errors = hydratables.map(hydrationFailure).filter(isError);
  if (errors.length) {
    const error = new AggregateError(errors);
    return {
      status: "failed",
      error,
    };
  }

  if (hydratables.map(isHydrationUntouched).some(identity)) {
    return { status: "needs hydration" };
  }

  if (hydratables.map(isHydrationInProgress).some(identity)) {
    return { status: "loading" };
  }

  if (hydratables.map(isHydrated).every(identity)) {
    return { status: "hydrated" };
  }

  // there is no other possible state expected; either input data was invalid
  // or this function has become outdated
  throw new Error(
    `Unable to determine valid hydration state: ${JSON.stringify(
      hydratables.map((h) => h.hydrationState),
    )}`,
  );
}
