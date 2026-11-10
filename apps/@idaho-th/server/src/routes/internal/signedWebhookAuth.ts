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

import type { FastifyReply, FastifyRequest } from "fastify";

import { getSignedWebhookRawBody } from "~@idaho-th/server/routes/internal/signedWebhookJsonParser";
import type {
  InMemoryRateLimiter,
  RateLimitConsumeResult,
} from "~@idaho-th/trpc/auth/rateLimit";
import { isWebhookSecretValid } from "~@idaho-th/trpc/auth/verifyWebhookSecret";
import type { ReplayNonceCache } from "~@idaho-th/trpc/auth/webhookSignature";
import {
  verifyWebhookSignature,
  WEBHOOK_NONCE_HEADER,
  WEBHOOK_SIGNATURE_HEADER,
  WEBHOOK_TIMESTAMP_HEADER,
} from "~@idaho-th/trpc/auth/webhookSignature";

const WEBHOOK_SECRET_HEADER = "x-webhook-secret";

function headerValue(req: FastifyRequest, name: string): string | undefined {
  const value = req.headers[name];
  return typeof value === "string" ? value : undefined;
}

/**
 * Applies the rate limit used by Auth0 Action webhooks.
 * Returns true when the request was rejected (caller should return immediately).
 *
 * Call this only AFTER {@link rejectIfWebhookAuthInvalid} has passed, and key it
 * on the request subject (email / auth0Sub) rather than the client IP. These
 * routes are reachable from the public load balancer but the only legitimate
 * caller is Auth0, so an IP key puts every real request — and every unsigned
 * request from anyone on the internet — into one bucket. Saturating it would
 * deny provider login and registration tenant-wide, since the Auth0 Actions
 * fail closed on a non-2xx response.
 */
export function rejectIfWebhookRateLimited(
  reply: FastifyReply,
  rateLimiter: InMemoryRateLimiter,
  key: string,
): boolean {
  const rateLimit: RateLimitConsumeResult = rateLimiter.consume(key);
  if (rateLimit.allowed) {
    return false;
  }

  const retryAfterSec = Math.ceil((rateLimit.retryAfterMs ?? 60_000) / 1000);
  reply.header("Retry-After", String(retryAfterSec));
  void reply.code(429).send();
  return true;
}

/**
 * Verifies the shared webhook secret, HMAC signature, and single-use nonce.
 * Returns true when the request was rejected (caller should return immediately).
 */
export function rejectIfWebhookAuthInvalid(
  req: FastifyRequest,
  reply: FastifyReply,
  {
    webhookName,
    route,
    nonceCache,
  }: {
    webhookName: string;
    route: string;
    nonceCache: ReplayNonceCache;
  },
): boolean {
  const secret = process.env["BACKEND_WEBHOOK_SECRET"];
  const rawBody = getSignedWebhookRawBody(req);

  if (!isWebhookSecretValid(secret, headerValue(req, WEBHOOK_SECRET_HEADER))) {
    req.log.warn({ webhook: webhookName, reason: "bad_secret" });
    void reply.code(401).send();
    return true;
  }

  const signatureResult = verifyWebhookSignature({
    route,
    secret,
    rawBody,
    timestamp: headerValue(req, WEBHOOK_TIMESTAMP_HEADER),
    nonce: headerValue(req, WEBHOOK_NONCE_HEADER),
    signature: headerValue(req, WEBHOOK_SIGNATURE_HEADER),
  });
  if (!signatureResult.valid) {
    req.log.warn({ webhook: webhookName, reason: signatureResult.reason });
    void reply.code(401).send();
    return true;
  }

  const nonce = headerValue(req, WEBHOOK_NONCE_HEADER);
  if (!nonce || !nonceCache.consume(nonce)) {
    req.log.warn({ webhook: webhookName, reason: "replayed" });
    void reply.code(401).send();
    return true;
  }

  return false;
}
