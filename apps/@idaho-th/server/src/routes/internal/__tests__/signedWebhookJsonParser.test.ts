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

import type { FastifyInstance, FastifyRequest } from "fastify";
import { describe, expect, it, vi } from "vitest";

import {
  getSignedWebhookRawBody,
  registerSignedJsonWebhookParser,
} from "~@idaho-th/server/routes/internal/signedWebhookJsonParser";

import { buildSignedWebhookServer } from "./signedWebhook.helpers";

const ROUTE = "/internal/parser-test";

const handler = vi.fn();

function registerSubjectRoute(server: FastifyInstance) {
  server.register(async (instance) => {
    registerSignedJsonWebhookParser(instance);
    instance.post(ROUTE, async (req, reply) => {
      // The route contract these webhooks share: an unparseable body arrives as
      // undefined and is rejected by schema validation, never by the parser.
      if (req.body === undefined) {
        return reply.code(400).send({ message: "Invalid request body" });
      }
      handler({
        rawBody: getSignedWebhookRawBody(req),
        parsedBody: req.body,
      });
      return reply.code(200).send({ ok: true });
    });
  });
}

async function post(payload: string, options?: { bodyLimit?: number }) {
  const server = await buildSignedWebhookServer(registerSubjectRoute, options);
  return server.inject({
    method: "POST",
    url: ROUTE,
    headers: { "content-type": "application/json" },
    payload,
  });
}

beforeEach(() => {
  vi.clearAllMocks();
});

describe("registerSignedJsonWebhookParser raw body fidelity", () => {
  it.each([
    ["reordered keys", '{"b":2,"a":1}'],
    ["unicode escapes", '{"email":"pro\\u0076ider@example.com"}'],
    ["trailing whitespace", '{"a":1}   \n'],
    ["leading whitespace", '  \n{"a":1}'],
    ["non-canonical spacing", '{ "a" : 1 ,  "b" : 2 }'],
  ])(
    "hands the verifier the exact bytes received (%s)",
    async (_label, payload) => {
      // The HMAC is computed over the raw bytes Auth0 signed, so the parser must
      // hand those bytes on rather than a copy it re-serialized.
      const response = await post(payload);

      expect(response.statusCode).toBe(200);
      expect(handler.mock.calls[0]?.[0].rawBody).toBe(payload);
    },
  );

  it("keeps the raw body even where re-serializing would change the bytes", async () => {
    const payload = '{ "a" : 1 ,  "b" : 2 }';

    await post(payload);

    const { rawBody, parsedBody } = handler.mock.calls[0]?.[0] ?? {};
    expect(rawBody).toBe(payload);
    expect(JSON.stringify(parsedBody)).not.toBe(rawBody);
  });

  it("still parses the body into an object", async () => {
    await post('{"email":"provider@example.com"}');

    expect(handler.mock.calls[0]?.[0].parsedBody).toEqual({
      email: "provider@example.com",
    });
  });
});

describe("registerSignedJsonWebhookParser rejections", () => {
  it.each([
    ["malformed JSON", "{not json"],
    ["a bare fragment", '{"a":'],
    ["an empty body", ""],
  ])(
    "returns 400 for %s and never runs the handler",
    async (_label, payload) => {
      const response = await post(payload);

      expect(response.statusCode).toBe(400);
      expect(JSON.parse(response.body)).toEqual({
        message: "Invalid request body",
      });
      expect(handler).not.toHaveBeenCalled();
    },
  );

  it("returns 413 for an oversized body and never runs the handler", async () => {
    const oversized = JSON.stringify({ padding: "x".repeat(2_000) });

    const response = await post(oversized, { bodyLimit: 1_024 });

    expect(response.statusCode).toBe(413);
    expect(handler).not.toHaveBeenCalled();
  });
});

describe("getSignedWebhookRawBody", () => {
  it("returns an empty string when no raw body was captured", () => {
    // Signing over "" can never match a real signature, so an unparsed request
    // fails verification rather than skipping it.
    expect(getSignedWebhookRawBody({} as never)).toBe("");
  });
});

/**
 * Driven by calling the parser Fastify would install, rather than through a
 * request. Fastify only ever hands it a string under `parseAs: "string"`, so
 * the Buffer arm and the registration options are unreachable from a route.
 */
describe("registerSignedJsonWebhookParser in isolation", () => {
  type ParserHandler = (
    req: FastifyRequest,
    body: string | Buffer,
    done: (err: Error | null, value?: unknown) => void,
  ) => void;

  function captureParser() {
    let captured:
      | { handler: ParserHandler; contentType: string; options: unknown }
      | undefined;

    const instance = {
      addContentTypeParser: (
        contentType: string,
        options: unknown,
        handler: ParserHandler,
      ) => {
        captured = { handler, contentType, options };
      },
    } as unknown as FastifyInstance;

    registerSignedJsonWebhookParser(instance);

    if (!captured) throw new Error("parser was not registered");
    return captured;
  }

  function parse(body: string | Buffer) {
    const { handler } = captureParser();
    const req = {} as FastifyRequest;
    const done = vi.fn();

    handler(req, body, done);

    return { req, done };
  }

  it("registers a string parser for application/json", () => {
    const { contentType, options } = captureParser();

    expect(contentType).toBe("application/json");
    expect(options).toEqual({ parseAs: "string" });
  });

  it("decodes a Buffer body as UTF-8 before storing the raw bytes", () => {
    const raw = '{"name":"Caf\u00e9"}';

    const { req, done } = parse(Buffer.from(raw, "utf8"));

    expect(getSignedWebhookRawBody(req)).toBe(raw);
    expect(done).toHaveBeenCalledWith(null, { name: "Caf\u00e9" });
  });

  it("reports malformed JSON as an undefined body, not as a parser error", () => {
    const raw = "{not json";

    const { req, done } = parse(raw);

    expect(getSignedWebhookRawBody(req)).toBe(raw);
    expect(done).toHaveBeenCalledWith(null, undefined);
    expect(done.mock.calls[0]?.[0]).toBeNull();
  });
});
