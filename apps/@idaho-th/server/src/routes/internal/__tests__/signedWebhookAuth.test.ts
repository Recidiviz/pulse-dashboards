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

import type { FastifyInstance, FastifyReply } from "fastify";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import {
  rejectIfWebhookAuthInvalid,
  rejectIfWebhookRateLimited,
} from "~@idaho-th/server/routes/internal/signedWebhookAuth";
import { registerSignedJsonWebhookParser } from "~@idaho-th/server/routes/internal/signedWebhookJsonParser";
import type { RateLimitConsumeResult } from "~@idaho-th/trpc/auth/rateLimit";
import { InMemoryRateLimiter } from "~@idaho-th/trpc/auth/rateLimit";
import {
  ReplayNonceCache,
  WEBHOOK_NONCE_HEADER,
  WEBHOOK_SIGNATURE_HEADER,
  WEBHOOK_TIMESTAMP_HEADER,
} from "~@idaho-th/trpc/auth/webhookSignature";

import {
  buildSignedWebhookServer,
  signedHeaders,
  uniqueNonce,
  WEBHOOK_SECRET,
  WEBHOOK_SECRET_HEADER,
} from "./signedWebhook.helpers";

const ROUTE = "/internal/signed-test";
const BODY = { email: "provider@example.com" };
const RAW_BODY = JSON.stringify(BODY);

const handler = vi.fn();

/** A fresh nonce cache per server, so one test's nonces cannot block another's. */
function registerSubjectRoute(server: FastifyInstance, rateLimit = false) {
  const nonceCache = new ReplayNonceCache();
  const rateLimiter = new InMemoryRateLimiter({
    windowMs: 60_000,
    maxRequests: 1,
  });

  server.register(async (instance) => {
    registerSignedJsonWebhookParser(instance);
    instance.post(ROUTE, async (req, reply) => {
      if (
        rejectIfWebhookAuthInvalid(req, reply, {
          webhookName: "signed-test",
          route: ROUTE,
          nonceCache,
        })
      ) {
        return;
      }
      if (rateLimit && rejectIfWebhookRateLimited(reply, rateLimiter, "key")) {
        return;
      }
      handler(req.body);
      return reply.code(200).send({ ok: true });
    });
  });
}

async function buildServer(rateLimit = false) {
  return buildSignedWebhookServer((server) =>
    registerSubjectRoute(server, rateLimit),
  );
}

beforeEach(() => {
  vi.clearAllMocks();
  process.env["BACKEND_WEBHOOK_SECRET"] = WEBHOOK_SECRET;
});

afterEach(() => {
  delete process.env["BACKEND_WEBHOOK_SECRET"];
});

async function post(
  server: FastifyInstance,
  headers: Record<string, string>,
  payload: string = RAW_BODY,
) {
  return server.inject({ method: "POST", url: ROUTE, headers, payload });
}

describe("rejectIfWebhookAuthInvalid", () => {
  it("rejects a request with no secret header", async () => {
    const server = await buildServer();
    const headers = signedHeaders({ route: ROUTE, rawBody: RAW_BODY });
    delete headers[WEBHOOK_SECRET_HEADER];

    const response = await post(server, headers);

    expect(response.statusCode).toBe(401);
    expect(handler).not.toHaveBeenCalled();
  });

  it("rejects a wrong secret", async () => {
    const server = await buildServer();

    const response = await post(
      server,
      signedHeaders({
        route: ROUTE,
        rawBody: RAW_BODY,
        secret: "wrong-secret",
      }),
    );

    expect(response.statusCode).toBe(401);
    expect(handler).not.toHaveBeenCalled();
  });

  it("rejects when the configured secret is missing entirely", async () => {
    delete process.env["BACKEND_WEBHOOK_SECRET"];
    const server = await buildServer();

    const response = await post(
      server,
      signedHeaders({ route: ROUTE, rawBody: RAW_BODY }),
    );

    // Fail closed: an unset secret must not make every request valid.
    expect(response.statusCode).toBe(401);
    expect(handler).not.toHaveBeenCalled();
  });

  it("rejects a correct secret with an invalid signature", async () => {
    const server = await buildServer();
    const headers = signedHeaders({ route: ROUTE, rawBody: RAW_BODY });
    headers[WEBHOOK_SIGNATURE_HEADER] = "a".repeat(64);

    const response = await post(server, headers);

    expect(response.statusCode).toBe(401);
    expect(handler).not.toHaveBeenCalled();
  });

  it("rejects a signature bound to a different route", async () => {
    const server = await buildServer();

    const response = await post(
      server,
      signedHeaders({
        route: ROUTE,
        rawBody: RAW_BODY,
        signWith: { route: "/internal/other" },
      }),
    );

    expect(response.statusCode).toBe(401);
    expect(handler).not.toHaveBeenCalled();
  });

  it("rejects a signature computed over a different body", async () => {
    const server = await buildServer();

    const response = await post(
      server,
      signedHeaders({
        route: ROUTE,
        rawBody: RAW_BODY,
        signWith: { rawBody: JSON.stringify({ email: "other@example.com" }) },
      }),
    );

    expect(response.statusCode).toBe(401);
    expect(handler).not.toHaveBeenCalled();
  });

  it("rejects a stale timestamp outside the replay window", async () => {
    const server = await buildServer();
    const staleTimestamp = String(Date.now() - 6 * 60_000);

    const response = await post(
      server,
      signedHeaders({
        route: ROUTE,
        rawBody: RAW_BODY,
        timestamp: staleTimestamp,
      }),
    );

    expect(response.statusCode).toBe(401);
    expect(handler).not.toHaveBeenCalled();
  });

  it("rejects a missing timestamp, nonce or signature header", async () => {
    for (const header of [
      WEBHOOK_TIMESTAMP_HEADER,
      WEBHOOK_NONCE_HEADER,
      WEBHOOK_SIGNATURE_HEADER,
    ]) {
      // eslint-disable-next-line no-await-in-loop
      const server = await buildServer();
      const headers = signedHeaders({ route: ROUTE, rawBody: RAW_BODY });
      delete headers[header];

      // eslint-disable-next-line no-await-in-loop
      expect((await post(server, headers)).statusCode).toBe(401);
    }
    expect(handler).not.toHaveBeenCalled();
  });

  it("rejects a replayed nonce on a second, otherwise valid request", async () => {
    const server = await buildServer();
    const nonce = uniqueNonce();
    const headers = () =>
      signedHeaders({ route: ROUTE, rawBody: RAW_BODY, nonce });

    expect((await post(server, headers())).statusCode).toBe(200);
    expect((await post(server, headers())).statusCode).toBe(401);
    expect(handler).toHaveBeenCalledTimes(1);
  });

  it("runs the handler exactly once for a fully valid request", async () => {
    const server = await buildServer();

    const response = await post(
      server,
      signedHeaders({ route: ROUTE, rawBody: RAW_BODY }),
    );

    expect(response.statusCode).toBe(200);
    expect(handler).toHaveBeenCalledTimes(1);
    expect(handler).toHaveBeenCalledWith(BODY);
  });

  it("returns an indistinguishable response for every rejection reason", async () => {
    const rejections = [
      signedHeaders({
        route: ROUTE,
        rawBody: RAW_BODY,
        secret: "wrong-secret",
      }),
      {
        ...signedHeaders({ route: ROUTE, rawBody: RAW_BODY }),
        [WEBHOOK_SIGNATURE_HEADER]: "a".repeat(64),
      },
      signedHeaders({
        route: ROUTE,
        rawBody: RAW_BODY,
        timestamp: String(Date.now() - 6 * 60_000),
      }),
    ];

    const responses = [];
    for (const headers of rejections) {
      // eslint-disable-next-line no-await-in-loop
      const server = await buildServer();
      // eslint-disable-next-line no-await-in-loop
      responses.push(await post(server, headers));
    }

    // A caller must not be able to tell a bad secret from a bad signature.
    const [baseline, ...others] = responses;
    if (!baseline) {
      throw new Error("no rejection responses were captured");
    }

    expect(baseline.statusCode).toBe(401);
    for (const response of others) {
      expect(response.statusCode).toBe(401);
      expect(response.body).toBe(baseline.body);
      expect(response.headers["content-type"]).toBe(
        baseline.headers["content-type"],
      );
    }
  });
});

describe("rejectIfWebhookRateLimited", () => {
  it("returns 429 with Retry-After once the limit is exhausted", async () => {
    const server = await buildServer(true);
    const send = () =>
      post(server, signedHeaders({ route: ROUTE, rawBody: RAW_BODY }));

    expect((await send()).statusCode).toBe(200);

    const limited = await send();
    expect(limited.statusCode).toBe(429);
    expect(Number(limited.headers["retry-after"])).toBeGreaterThan(0);
    expect(handler).toHaveBeenCalledTimes(1);
  });

  it("is only reachable after authentication passes", async () => {
    const server = await buildServer(true);

    // An unsigned flood must not be able to consume the limiter's budget.
    for (let i = 0; i < 5; i += 1) {
      // eslint-disable-next-line no-await-in-loop
      const response = await post(
        server,
        signedHeaders({ route: ROUTE, rawBody: RAW_BODY, secret: "wrong" }),
      );
      expect(response.statusCode).toBe(401);
    }

    expect(
      (await post(server, signedHeaders({ route: ROUTE, rawBody: RAW_BODY })))
        .statusCode,
    ).toBe(200);
  });
});

/**
 * Driven with a stubbed reply and limiter rather than a request, because the
 * real limiter always reports a retry window — the `?? 60_000` fallback and the
 * rounding are only reachable from here.
 */
describe("rejectIfWebhookRateLimited in isolation", () => {
  function fakeReply() {
    const send = vi.fn();
    const reply = { header: vi.fn(), code: vi.fn(() => ({ send })) };
    return { reply: reply as unknown as FastifyReply, raw: reply, send };
  }

  function fakeLimiter(result: RateLimitConsumeResult) {
    const consume = vi.fn(() => result);
    return { limiter: { consume } as unknown as InMemoryRateLimiter, consume };
  }

  it("passes the request through and touches no reply when the limit allows it", () => {
    const { reply, raw } = fakeReply();
    const { limiter, consume } = fakeLimiter({ allowed: true });

    expect(rejectIfWebhookRateLimited(reply, limiter, "auth0|abc")).toBe(false);
    expect(consume).toHaveBeenCalledWith("auth0|abc");
    expect(raw.code).not.toHaveBeenCalled();
    expect(raw.header).not.toHaveBeenCalled();
  });

  it("rounds Retry-After up to whole seconds", () => {
    const { reply, raw, send } = fakeReply();
    const { limiter } = fakeLimiter({ allowed: false, retryAfterMs: 1200 });

    expect(rejectIfWebhookRateLimited(reply, limiter, "auth0|abc")).toBe(true);
    expect(raw.header).toHaveBeenCalledWith("Retry-After", "2");
    expect(raw.code).toHaveBeenCalledWith(429);
    expect(send).toHaveBeenCalledWith();
  });

  it("falls back to 60 seconds when the limiter reports no retry window", () => {
    const { reply, raw } = fakeReply();
    const { limiter } = fakeLimiter({ allowed: false });

    expect(rejectIfWebhookRateLimited(reply, limiter, "auth0|abc")).toBe(true);
    expect(raw.header).toHaveBeenCalledWith("Retry-After", "60");
  });

  it("keys the limit on the subject it is given, not on anything from the request", () => {
    const { reply } = fakeReply();
    const { limiter, consume } = fakeLimiter({ allowed: true });

    rejectIfWebhookRateLimited(reply, limiter, "provider@example.com");

    expect(consume).toHaveBeenCalledTimes(1);
    expect(consume).toHaveBeenCalledWith("provider@example.com");
  });
});
