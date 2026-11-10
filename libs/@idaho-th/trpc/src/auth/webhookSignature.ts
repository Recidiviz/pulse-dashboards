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

import crypto from "crypto";

/**
 * HMAC-SHA256 verification for Auth0 Action webhooks
 * (`POST /internal/link-provider`, `POST /internal/check-provider-provisioned`,
 * `POST /internal/link-staff`).
 *
 * The Auth0 Action signs `${route}.${timestamp}.${nonce}.${rawBody}` with the
 * shared secret and sends the signature, timestamp, and a per-request nonce as
 * headers. The route binds the signature to a single endpoint so a captured
 * request cannot be replayed against another webhook that shares the secret.
 * The backend recomputes the signature over the *raw* body (not a re-serialized
 * copy) and compares it in constant time. This proves both that the caller knows
 * the secret AND that the body was not tampered with in transit — neither of
 * which a plaintext shared-secret header alone can guarantee.
 *
 * Replay protection has two layers:
 * - a freshness window on the signed timestamp (bounds how long a captured
 *   request is usable at all), and
 * - a nonce cache that rejects any signed request seen twice within that window.
 *
 * Header names are lowercase because Fastify normalizes incoming header keys.
 */
export const WEBHOOK_TIMESTAMP_HEADER = "x-idaho-th-timestamp";
export const WEBHOOK_NONCE_HEADER = "x-idaho-th-nonce";
export const WEBHOOK_SIGNATURE_HEADER = "x-idaho-th-signature";

/** Fastify route paths for signed Auth0 webhooks (must match Action signing). */
export const SIGNED_WEBHOOK_ROUTES = {
  linkProvider: "/internal/link-provider",
  checkProviderProvisioned: "/internal/check-provider-provisioned",
  linkStaff: "/internal/link-staff",
  checkStaffAuthorized: "/internal/check-staff-authorized",
  checkRecidivizStaff: "/internal/check-recidiviz-staff",
} as const;

export type SignedWebhookRoute =
  (typeof SIGNED_WEBHOOK_ROUTES)[keyof typeof SIGNED_WEBHOOK_ROUTES];

/** Default freshness window for the signed timestamp (5 minutes). */
export const DEFAULT_WEBHOOK_TOLERANCE_MS = 5 * 60_000;

export type WebhookSignatureFailureReason =
  | "missing_fields"
  | "stale_timestamp"
  | "bad_signature"
  | "replayed";

export type WebhookSignatureResult =
  | { valid: true }
  | { valid: false; reason: WebhookSignatureFailureReason };

export type VerifyWebhookSignatureInput = {
  route: SignedWebhookRoute | string;
  secret: string | undefined;
  rawBody: string;
  timestamp: string | undefined;
  nonce: string | undefined;
  signature: string | undefined;
  toleranceMs?: number;
  /** Injectable clock for tests. */
  now?: number;
};

/**
 * Computes the hex-encoded HMAC-SHA256 over
 * `${route}.${timestamp}.${nonce}.${rawBody}`. Shared by the verifier and the
 * test suite; the Auth0 Action computes the same value independently.
 */
export function computeWebhookSignature(
  secret: string,
  route: string,
  timestamp: string,
  nonce: string,
  rawBody: string,
): string {
  return crypto
    .createHmac("sha256", secret)
    .update(`${route}.${timestamp}.${nonce}.${rawBody}`)
    .digest("hex");
}

function constantTimeEqualsHex(a: string, b: string): boolean {
  // timingSafeEqual throws on length mismatch, so guard first. Comparing the
  // hex strings (fixed 64 chars for SHA-256) keeps the comparison constant-time
  // for any input that reaches it.
  if (a.length !== b.length) return false;
  try {
    return crypto.timingSafeEqual(
      Buffer.from(a, "utf8"),
      Buffer.from(b, "utf8"),
    );
  } catch {
    return false;
  }
}

/**
 * Verifies the signature and timestamp freshness. Pure and side-effect free —
 * nonce/replay bookkeeping is handled separately by {@link ReplayNonceCache} so
 * that the signature math can be unit-tested in isolation.
 */
export function verifyWebhookSignature(
  input: VerifyWebhookSignatureInput,
): WebhookSignatureResult {
  const {
    route,
    secret,
    rawBody,
    timestamp,
    nonce,
    signature,
    toleranceMs = DEFAULT_WEBHOOK_TOLERANCE_MS,
    now = Date.now(),
  } = input;

  if (!route || !secret || !timestamp || !nonce || !signature) {
    return { valid: false, reason: "missing_fields" };
  }

  const timestampMs = Number.parseInt(timestamp, 10);
  if (!Number.isFinite(timestampMs)) {
    return { valid: false, reason: "stale_timestamp" };
  }
  if (Math.abs(now - timestampMs) > toleranceMs) {
    return { valid: false, reason: "stale_timestamp" };
  }

  const expected = computeWebhookSignature(
    secret,
    route,
    timestamp,
    nonce,
    rawBody,
  );
  if (!constantTimeEqualsHex(expected, signature)) {
    return { valid: false, reason: "bad_signature" };
  }

  return { valid: true };
}

/**
 * In-memory single-use nonce cache. A nonce that has already been consumed
 * within its TTL is rejected, closing the replay window left open by the
 * timestamp tolerance.
 *
 * Production note: like the IP rate limiter, this is per-instance. Behind
 * multiple Cloud Run instances a replayed request could land on a different
 * instance within the tolerance window; pair with a shared store (Redis) for
 * global guarantees. The signed timestamp still bounds the exposure.
 */
export class ReplayNonceCache {
  private readonly seen = new Map<string, number>();

  constructor(private readonly ttlMs: number = DEFAULT_WEBHOOK_TOLERANCE_MS) {}

  /** Returns true if the nonce is fresh (and records it); false if replayed. */
  consume(nonce: string, now: number = Date.now()): boolean {
    this.pruneExpired(now);

    const expiresAt = this.seen.get(nonce);
    if (expiresAt !== undefined && expiresAt > now) {
      return false;
    }

    this.seen.set(nonce, now + this.ttlMs);
    return true;
  }

  private pruneExpired(now: number): void {
    for (const [nonce, expiresAt] of this.seen) {
      if (expiresAt <= now) this.seen.delete(nonce);
    }
  }
}

export const linkProviderNonceCache = new ReplayNonceCache();

export const checkProviderProvisionedNonceCache = new ReplayNonceCache();

export const linkStaffNonceCache = new ReplayNonceCache();

export const checkStaffAuthorizedNonceCache = new ReplayNonceCache();

export const checkRecidivizStaffNonceCache = new ReplayNonceCache();
