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

import { InMemoryRateLimiter } from "~@idaho-th/trpc/auth/rateLimit";
import { getOptionalPositiveIntEnv } from "~@idaho-th/trpc/routes/common/env";
import {
  PLACES_RATE_LIMIT_MAX_REQUESTS,
  PLACES_RATE_LIMIT_WINDOW_MS,
} from "~@idaho-th/trpc/routes/places/constants";

/**
 * Per-staff limiter for the billable, per-keystroke Places endpoints. Keyed by
 * the authenticated `staffPseudonymizedId` (not a spoofable IP), so it is a
 * sound cost control for the single-instance Idaho MVP.
 *
 * REVISIT AT SCALE: this is in-memory and therefore per-instance — each Cloud
 * Run instance enforces its own window, so the effective global limit is
 * `maxRequests × instanceCount`. Acceptable now (one instance, internal staff
 * users). Migration trigger: full-state launch (Q2–Q3 2026), horizontal
 * scaling to >1 instance, or exposing this to non-staff/public callers.
 * Migration path: back `InMemoryRateLimiter` with a Redis sliding-window store
 * behind the same `consume(key)` interface — no call-site changes needed.
 */
export const placesRateLimiter = new InMemoryRateLimiter({
  windowMs: getOptionalPositiveIntEnv(
    "IDAHO_TH_PLACES_RATE_LIMIT_WINDOW_MS",
    PLACES_RATE_LIMIT_WINDOW_MS,
  ),
  maxRequests: getOptionalPositiveIntEnv(
    "IDAHO_TH_PLACES_RATE_LIMIT_MAX",
    PLACES_RATE_LIMIT_MAX_REQUESTS,
  ),
});

export function assertWithinPlacesRateLimit(
  staffPseudonymizedId: string,
): void {
  const result = placesRateLimiter.consume(staffPseudonymizedId);
  if (result.allowed) return;

  const retryAfterSec = Math.ceil((result.retryAfterMs ?? 60_000) / 1000);
  throw new TRPCError({
    code: "TOO_MANY_REQUESTS",
    message: `Too many address lookups. Please try again in ${retryAfterSec} seconds.`,
  });
}
