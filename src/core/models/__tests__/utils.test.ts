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

import { noop } from "lodash";

import { HydrationState, HydrationStateMachine } from "../types";
import { compositeHydrationState } from "../utils";

describe("compositeHydrationState", () => {
  const statuses = {
    needsHydration: { status: "needs hydration" },
    loading: { status: "loading" },
    failed: { status: "failed", error: new Error("test") },
    hydrated: { status: "hydrated" },
  } satisfies Record<string, HydrationState>;

  const h1: HydrationStateMachine = {
    hydrationState: { status: "needs hydration" },
    hydrate: noop,
  };

  const h2: HydrationStateMachine = {
    hydrationState: { status: "needs hydration" },
    hydrate: noop,
  };

  test.each([
    [statuses.needsHydration, statuses.needsHydration],
    [statuses.needsHydration, statuses.loading],
    [statuses.needsHydration, statuses.hydrated],
  ])("needs hydration (args %s + %s)", (hydrationStateA, hydrationStateB) => {
    h1.hydrationState = hydrationStateA;
    h2.hydrationState = hydrationStateB;
    expect(compositeHydrationState([h1, h2])).toEqual({
      status: "needs hydration",
    });

    h1.hydrationState = hydrationStateB;
    h2.hydrationState = hydrationStateA;
    expect(compositeHydrationState([h1, h2])).toEqual({
      status: "needs hydration",
    });
  });

  test.each([
    [statuses.loading, statuses.loading],
    [statuses.loading, statuses.hydrated],
  ])("loading (args %s + %s)", (hydrationStateA, hydrationStateB) => {
    h1.hydrationState = hydrationStateA;
    h2.hydrationState = hydrationStateB;
    expect(compositeHydrationState([h1, h2])).toEqual({ status: "loading" });

    h1.hydrationState = hydrationStateB;
    h2.hydrationState = hydrationStateA;
    expect(compositeHydrationState([h1, h2])).toEqual({ status: "loading" });
  });

  test.each([
    [statuses.failed, statuses.failed],
    [statuses.failed, statuses.loading],
    [statuses.failed, statuses.hydrated],
    [statuses.failed, statuses.needsHydration],
  ])("failed (args %s + %s)", (hydrationStateA, hydrationStateB) => {
    h1.hydrationState = hydrationStateA;
    h2.hydrationState = hydrationStateB;
    expect(compositeHydrationState([h1, h2])).toEqual({
      status: "failed",
      error: expect.any(Error),
    });

    h1.hydrationState = hydrationStateB;
    h2.hydrationState = hydrationStateA;
    expect(compositeHydrationState([h1, h2])).toEqual({
      status: "failed",
      error: expect.any(Error),
    });
  });

  test("hydrated", () => {
    h1.hydrationState = statuses.hydrated;
    h2.hydrationState = statuses.hydrated;
    expect(compositeHydrationState([h1, h2])).toEqual({ status: "hydrated" });
  });
});
