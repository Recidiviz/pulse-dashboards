// Recidiviz - a data platform for criminal justice reform
// Copyright (C) 2026 Recidiviz, Inc.
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

import { TRPCError } from "@trpc/server";

import {
  PLACES_RATE_LIMIT_MAX_REQUESTS,
  PLACES_RATE_LIMIT_WINDOW_MS,
} from "~@idaho-th/trpc/routes/places/constants";
import {
  assertWithinPlacesRateLimit,
  placesRateLimiter,
} from "~@idaho-th/trpc/routes/places/places.rateLimit";

/** Unique per test: the limiter is a module singleton shared by this file. */
let staffCounter = 0;
function nextStaffId() {
  staffCounter += 1;
  return `staff-${staffCounter}-${Date.now()}`;
}

function exhaust(staffPseudonymizedId: string) {
  for (let i = 0; i < placesRateLimiter.maxRequests; i += 1) {
    assertWithinPlacesRateLimit(staffPseudonymizedId);
  }
}

afterEach(() => {
  vi.useRealTimers();
});

describe("assertWithinPlacesRateLimit", () => {
  it("uses the documented default window and ceiling", () => {
    expect(placesRateLimiter.maxRequests).toBe(PLACES_RATE_LIMIT_MAX_REQUESTS);
  });

  it("allows every request up to the ceiling", () => {
    const staffPseudonymizedId = nextStaffId();

    expect(() => exhaust(staffPseudonymizedId)).not.toThrow();
  });

  it("throws TOO_MANY_REQUESTS past the ceiling", () => {
    const staffPseudonymizedId = nextStaffId();
    exhaust(staffPseudonymizedId);

    let thrown: TRPCError | undefined;
    try {
      assertWithinPlacesRateLimit(staffPseudonymizedId);
    } catch (error) {
      thrown = error as TRPCError;
    }

    expect(thrown).toBeInstanceOf(TRPCError);
    expect(thrown?.code).toBe("TOO_MANY_REQUESTS");
    expect(thrown?.message).toMatch(/try again in \d+ seconds/);
  });

  it("keys the budget per staff member", () => {
    const exhausted = nextStaffId();
    const other = nextStaffId();
    exhaust(exhausted);

    // One staff member burning their budget must not lock out the rest.
    expect(() => assertWithinPlacesRateLimit(exhausted)).toThrow();
    expect(() => assertWithinPlacesRateLimit(other)).not.toThrow();
  });

  it("lets the caller back in once the window rolls over", () => {
    vi.useFakeTimers();
    const staffPseudonymizedId = nextStaffId();
    exhaust(staffPseudonymizedId);
    expect(() => assertWithinPlacesRateLimit(staffPseudonymizedId)).toThrow();

    vi.advanceTimersByTime(PLACES_RATE_LIMIT_WINDOW_MS);

    expect(() =>
      assertWithinPlacesRateLimit(staffPseudonymizedId),
    ).not.toThrow();
  });
});
