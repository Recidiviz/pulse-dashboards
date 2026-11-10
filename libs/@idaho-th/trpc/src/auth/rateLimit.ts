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

import type { FastifyRequest } from "fastify";

import { getOptionalPositiveIntEnv } from "~@idaho-th/trpc/routes/common/env";

export type RateLimitConfig = {
  windowMs: number;
  maxRequests: number;
  maxKeys?: number;
};

export type RateLimitConsumeResult = {
  allowed: boolean;
  retryAfterMs?: number;
};

type RateLimitEntry = {
  windowStartMs: number;
  count: number;
};

/**
 * Fixed-window, in-memory rate limiter keyed by client IP (or other string).
 *
 * Production note: limits are enforced per server instance. Behind Cloud Run with
 * multiple instances, combine with edge rate limiting (Cloud Armor) or a shared
 * store (Redis) for global enforcement.
 */
export class InMemoryRateLimiter {
  private readonly bucket = new Map<string, RateLimitEntry>();

  constructor(private readonly config: RateLimitConfig) {}

  /**
   * Resolved ceiling for this limiter. Exposed so callers (and tests) can read
   * the configured limit instead of restating it.
   */
  get maxRequests(): number {
    return this.config.maxRequests;
  }

  consume(key: string): RateLimitConsumeResult {
    const now = Date.now();
    const { windowMs, maxRequests, maxKeys = 10_000 } = this.config;

    if (this.bucket.size > maxKeys) {
      this.pruneExpired(now);
    }

    let entry = this.bucket.get(key);
    if (!entry || now - entry.windowStartMs >= windowMs) {
      entry = { windowStartMs: now, count: 0 };
    }

    entry.count += 1;
    this.bucket.set(key, entry);

    if (entry.count > maxRequests) {
      const retryAfterMs = windowMs - (now - entry.windowStartMs);
      return { allowed: false, retryAfterMs: Math.max(0, retryAfterMs) };
    }

    return { allowed: true };
  }

  private pruneExpired(now: number): void {
    const { windowMs } = this.config;
    for (const [key, entry] of this.bucket) {
      if (now - entry.windowStartMs >= windowMs) {
        this.bucket.delete(key);
      }
    }
  }
}

/**
 * The rate-limit key for the unauthenticated endpoints, so it must not be
 * attacker-controlled.
 *
 * Behind the GCLB the header reads `<client-supplied...>, <client>, <lb>`:
 * the balancer appends the connecting address and its own, but preserves
 * whatever the caller sent ahead of them. The left-most hop is therefore
 * written by the caller and trivially rotated to defeat the limiter — only
 * the second-from-right hop is appended by infrastructure.
 *
 * Anything shorter than the expected chain means the request did not arrive
 * through the balancer, so the socket address is used rather than a hop that
 * nothing vouched for.
 *
 * The offset is configurable because the chain length is a property of the
 * deployment, not of this code: if a future hop is added in front, picking a
 * fixed position would silently key every caller on the same proxy address
 * and collapse the limiter into one shared bucket. Cloud Armor enforces its
 * own per-IP limit on the real source address ahead of this, so a wrong
 * offset costs granularity here rather than removing the protection.
 */
const TRUSTED_PROXY_HOP_OFFSET = getOptionalPositiveIntEnv(
  "IDAHO_TH_TRUSTED_PROXY_HOP_OFFSET",
  2,
);

export function getClientIp(req: FastifyRequest): string {
  const forwarded = req.headers["x-forwarded-for"];
  const rawHeader = Array.isArray(forwarded) ? forwarded.join(",") : forwarded;

  if (typeof rawHeader === "string" && rawHeader.length > 0) {
    const hops = rawHeader
      .split(",")
      .map((hop) => hop.trim())
      .filter((hop) => hop.length > 0);

    if (hops.length >= TRUSTED_PROXY_HOP_OFFSET) {
      return hops[hops.length - TRUSTED_PROXY_HOP_OFFSET];
    }
  }

  if (typeof req.ip === "string" && req.ip.length > 0) {
    return req.ip;
  }

  return "unknown";
}

/**
 * Keyed by client IP. Every sign-in attempt now consults checkSignInEmail —
 * staff included, not just providers — so a site behind a single NAT egress IP
 * shares one bucket. The ceiling is sized for that shared case rather than for
 * one user, since locking a whole facility out of login is worse than the slow
 * email probing this limit is meant to blunt.
 */
export const signInEmailRateLimiter = new InMemoryRateLimiter({
  windowMs: getOptionalPositiveIntEnv(
    "IDAHO_TH_SIGN_IN_EMAIL_RATE_LIMIT_WINDOW_MS",
    60_000,
  ),
  maxRequests: getOptionalPositiveIntEnv(
    "IDAHO_TH_SIGN_IN_EMAIL_RATE_LIMIT_MAX",
    60,
  ),
});

export const linkProviderRateLimiter = new InMemoryRateLimiter({
  windowMs: getOptionalPositiveIntEnv(
    "IDAHO_TH_LINK_PROVIDER_RATE_LIMIT_WINDOW_MS",
    60_000,
  ),
  maxRequests: getOptionalPositiveIntEnv(
    "IDAHO_TH_LINK_PROVIDER_RATE_LIMIT_MAX",
    20,
  ),
});

export const checkProviderProvisionedRateLimiter = new InMemoryRateLimiter({
  windowMs: getOptionalPositiveIntEnv(
    "IDAHO_TH_CHECK_PROVIDER_PROVISIONED_RATE_LIMIT_WINDOW_MS",
    60_000,
  ),
  maxRequests: getOptionalPositiveIntEnv(
    "IDAHO_TH_CHECK_PROVIDER_PROVISIONED_RATE_LIMIT_MAX",
    30,
  ),
});

export const linkStaffRateLimiter = new InMemoryRateLimiter({
  windowMs: getOptionalPositiveIntEnv(
    "IDAHO_TH_LINK_STAFF_RATE_LIMIT_WINDOW_MS",
    60_000,
  ),
  maxRequests: getOptionalPositiveIntEnv(
    "IDAHO_TH_LINK_STAFF_RATE_LIMIT_MAX",
    20,
  ),
});

export const checkStaffAuthorizedRateLimiter = new InMemoryRateLimiter({
  windowMs: getOptionalPositiveIntEnv(
    "IDAHO_TH_CHECK_STAFF_AUTHORIZED_RATE_LIMIT_WINDOW_MS",
    60_000,
  ),
  maxRequests: getOptionalPositiveIntEnv(
    "IDAHO_TH_CHECK_STAFF_AUTHORIZED_RATE_LIMIT_MAX",
    30,
  ),
});

export const checkRecidivizStaffRateLimiter = new InMemoryRateLimiter({
  windowMs: getOptionalPositiveIntEnv(
    "IDAHO_TH_CHECK_RECIDIVIZ_STAFF_RATE_LIMIT_WINDOW_MS",
    60_000,
  ),
  maxRequests: getOptionalPositiveIntEnv(
    "IDAHO_TH_CHECK_RECIDIVIZ_STAFF_RATE_LIMIT_MAX",
    30,
  ),
});

export const checkRecidivizRoleChoiceRateLimiter = new InMemoryRateLimiter({
  windowMs: getOptionalPositiveIntEnv(
    "IDAHO_TH_CHECK_RECIDIVIZ_ROLE_CHOICE_RATE_LIMIT_WINDOW_MS",
    60_000,
  ),
  maxRequests: getOptionalPositiveIntEnv(
    "IDAHO_TH_CHECK_RECIDIVIZ_ROLE_CHOICE_RATE_LIMIT_MAX",
    60,
  ),
});
