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

import {
  computeWebhookSignature,
  ReplayNonceCache,
  SIGNED_WEBHOOK_ROUTES,
  verifyWebhookSignature,
} from "../webhookSignature";

describe("webhookSignature", () => {
  const secret = "test-webhook-secret";
  const timestamp = "1_700_000_000_000";
  const nonce = "nonce-abc";
  const rawBody = JSON.stringify({ email: "provider@example.com" });

  test("verifyWebhookSignature accepts a matching route-bound signature", () => {
    const signature = computeWebhookSignature(
      secret,
      SIGNED_WEBHOOK_ROUTES.linkProvider,
      timestamp,
      nonce,
      rawBody,
    );

    expect(
      verifyWebhookSignature({
        route: SIGNED_WEBHOOK_ROUTES.linkProvider,
        secret,
        rawBody,
        timestamp,
        nonce,
        signature,
        now: Number(timestamp),
      }),
    ).toEqual({ valid: true });
  });

  test("verifyWebhookSignature rejects a signature signed for a different route", () => {
    const signature = computeWebhookSignature(
      secret,
      SIGNED_WEBHOOK_ROUTES.linkProvider,
      timestamp,
      nonce,
      rawBody,
    );

    expect(
      verifyWebhookSignature({
        route: SIGNED_WEBHOOK_ROUTES.checkProviderProvisioned,
        secret,
        rawBody,
        timestamp,
        nonce,
        signature,
        now: Number(timestamp),
      }),
    ).toEqual({ valid: false, reason: "bad_signature" });
  });

  test("verifyWebhookSignature requires route", () => {
    const signature = computeWebhookSignature(
      secret,
      SIGNED_WEBHOOK_ROUTES.linkProvider,
      timestamp,
      nonce,
      rawBody,
    );

    expect(
      verifyWebhookSignature({
        route: "",
        secret,
        rawBody,
        timestamp,
        nonce,
        signature,
        now: Number(timestamp),
      }),
    ).toEqual({ valid: false, reason: "missing_fields" });
  });

  test("verifyWebhookSignature rejects a non-numeric timestamp", () => {
    const numericTimestamp = "1700000000000";
    const signature = computeWebhookSignature(
      secret,
      SIGNED_WEBHOOK_ROUTES.linkProvider,
      "not-a-number",
      nonce,
      rawBody,
    );

    expect(
      verifyWebhookSignature({
        route: SIGNED_WEBHOOK_ROUTES.linkProvider,
        secret,
        rawBody,
        timestamp: "not-a-number",
        nonce,
        signature,
        now: Number(numericTimestamp),
      }),
    ).toEqual({ valid: false, reason: "stale_timestamp" });
  });

  test("verifyWebhookSignature rejects a timestamp outside the tolerance", () => {
    const now = 1_700_000_000_000;
    const toleranceMs = 30_000;

    for (const skewMs of [-(toleranceMs + 1), toleranceMs + 1]) {
      const signedAt = String(now + skewMs);
      const signature = computeWebhookSignature(
        secret,
        SIGNED_WEBHOOK_ROUTES.linkProvider,
        signedAt,
        nonce,
        rawBody,
      );

      expect(
        verifyWebhookSignature({
          route: SIGNED_WEBHOOK_ROUTES.linkProvider,
          secret,
          rawBody,
          timestamp: signedAt,
          nonce,
          signature,
          toleranceMs,
          now,
        }),
      ).toEqual({ valid: false, reason: "stale_timestamp" });
    }
  });

  test("verifyWebhookSignature rejects a signature of the wrong length", () => {
    expect(
      verifyWebhookSignature({
        route: SIGNED_WEBHOOK_ROUTES.linkProvider,
        secret,
        rawBody,
        timestamp,
        nonce,
        signature: "deadbeef",
        now: Number(timestamp),
      }),
    ).toEqual({ valid: false, reason: "bad_signature" });
  });

  test("verifyWebhookSignature rejects a same-length multi-byte signature", () => {
    // Equal character length but unequal UTF-8 byte length makes
    // timingSafeEqual throw; the verifier must answer false, not propagate it.
    const expected = computeWebhookSignature(
      secret,
      SIGNED_WEBHOOK_ROUTES.linkProvider,
      timestamp,
      nonce,
      rawBody,
    );
    const multiByte = `é${expected.slice(1)}`;
    expect(multiByte).toHaveLength(expected.length);

    expect(
      verifyWebhookSignature({
        route: SIGNED_WEBHOOK_ROUTES.linkProvider,
        secret,
        rawBody,
        timestamp,
        nonce,
        signature: multiByte,
        now: Number(timestamp),
      }),
    ).toEqual({ valid: false, reason: "bad_signature" });
  });

  test("verifyWebhookSignature requires a secret, nonce and signature", () => {
    const base = {
      route: SIGNED_WEBHOOK_ROUTES.linkProvider,
      secret,
      rawBody,
      timestamp,
      nonce,
      signature: "a".repeat(64),
      now: Number(timestamp),
    };

    for (const missing of [
      "secret",
      "nonce",
      "signature",
      "timestamp",
    ] as const) {
      expect(verifyWebhookSignature({ ...base, [missing]: "" })).toEqual({
        valid: false,
        reason: "missing_fields",
      });
    }
  });

  test("ReplayNonceCache rejects a consumed nonce until it expires", () => {
    const cache = new ReplayNonceCache(60_000);
    const now = 1_700_000_000_000;

    expect(cache.consume("nonce-1", now)).toBe(true);
    expect(cache.consume("nonce-1", now + 1)).toBe(false);
    expect(cache.consume("nonce-1", now + 60_001)).toBe(true);
  });
});
