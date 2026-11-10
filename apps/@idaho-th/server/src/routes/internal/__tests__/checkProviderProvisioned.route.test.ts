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

import type { FastifyInstance } from "fastify";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

const isProvisionedProviderEmailMock = vi.hoisted(() => vi.fn());
const getPrismaClientForStateCodeMock = vi.hoisted(() => vi.fn());

vi.mock("~@idaho-th/trpc/auth/isProvisionedProviderEmail", () => ({
  isProvisionedProviderEmail: isProvisionedProviderEmailMock,
}));

vi.mock("~@idaho-th/prisma", () => ({
  getPrismaClientForStateCode: getPrismaClientForStateCodeMock,
}));

import { registerCheckProviderProvisionedRoute } from "~@idaho-th/server/routes/internal/checkProviderProvisioned";
import {
  SIGNED_WEBHOOK_ROUTES,
  WEBHOOK_SIGNATURE_HEADER,
} from "~@idaho-th/trpc/auth/webhookSignature";

import {
  buildSignedWebhookServer,
  signedHeaders,
  WEBHOOK_SECRET,
} from "./signedWebhook.helpers";

const ROUTE = SIGNED_WEBHOOK_ROUTES.checkProviderProvisioned;
const KNOWN_EMAIL = "provider@example.com";
const UNKNOWN_EMAIL = "unknown@example.com";

/** Unique per call so the shared per-email rate limiter never blocks a test. */
let emailCounter = 0;
function uniqueEmail(prefix: string) {
  emailCounter += 1;
  return `${prefix}+${emailCounter}@example.com`;
}

beforeEach(() => {
  vi.clearAllMocks();
  process.env["BACKEND_WEBHOOK_SECRET"] = WEBHOOK_SECRET;
  getPrismaClientForStateCodeMock.mockReturnValue({});
  isProvisionedProviderEmailMock.mockResolvedValue(true);
});

afterEach(() => {
  delete process.env["BACKEND_WEBHOOK_SECRET"];
});

async function buildServer() {
  return buildSignedWebhookServer(registerCheckProviderProvisionedRoute);
}

async function post(
  server: FastifyInstance,
  body: Record<string, unknown>,
  headerOverrides?: Record<string, string>,
) {
  const rawBody = JSON.stringify(body);
  return server.inject({
    method: "POST",
    url: ROUTE,
    headers: {
      ...signedHeaders({ route: ROUTE, rawBody }),
      ...headerOverrides,
    },
    payload: rawBody,
  });
}

describe("POST /internal/check-provider-provisioned auth gate", () => {
  it("rejects before any DB work when the signature is invalid", async () => {
    const server = await buildServer();

    const response = await post(
      server,
      { email: uniqueEmail("provider") },
      { [WEBHOOK_SIGNATURE_HEADER]: "a".repeat(64) },
    );

    expect(response.statusCode).toBe(401);
    expect(getPrismaClientForStateCodeMock).not.toHaveBeenCalled();
    expect(isProvisionedProviderEmailMock).not.toHaveBeenCalled();
  });

  it("rejects a signature bound to the link-provider route", async () => {
    const server = await buildServer();
    const rawBody = JSON.stringify({ email: uniqueEmail("provider") });

    const response = await server.inject({
      method: "POST",
      url: ROUTE,
      headers: signedHeaders({
        route: ROUTE,
        rawBody,
        signWith: { route: SIGNED_WEBHOOK_ROUTES.linkProvider },
      }),
      payload: rawBody,
    });

    expect(response.statusCode).toBe(401);
    expect(isProvisionedProviderEmailMock).not.toHaveBeenCalled();
  });
});

describe("POST /internal/check-provider-provisioned input validation", () => {
  it.each([
    ["a malformed email", { email: "not-an-email" }],
    ["a missing email", {}],
    ["a non-string email", { email: 42 }],
  ])("returns 400 for %s before the lookup", async (_label, body) => {
    const server = await buildServer();

    const response = await post(server, body);

    expect(response.statusCode).toBe(400);
    expect(JSON.parse(response.body)).toEqual({
      message: "Invalid request body",
    });
    expect(isProvisionedProviderEmailMock).not.toHaveBeenCalled();
  });
});

describe("POST /internal/check-provider-provisioned lookup", () => {
  it("returns 200 for a provisioned provider and calls the check once", async () => {
    const server = await buildServer();
    const email = uniqueEmail("provider");

    const response = await post(server, { email });

    expect(response.statusCode).toBe(200);
    expect(JSON.parse(response.body)).toEqual({ success: true });
    expect(isProvisionedProviderEmailMock).toHaveBeenCalledTimes(1);
    expect(isProvisionedProviderEmailMock).toHaveBeenCalledWith(
      expect.anything(),
      email,
    );
  });

  it("returns 404 for an address with no provisioned provider", async () => {
    isProvisionedProviderEmailMock.mockResolvedValue(false);
    const server = await buildServer();

    const response = await post(server, { email: uniqueEmail("unknown") });

    expect(response.statusCode).toBe(404);
    expect(JSON.parse(response.body)).toEqual({
      message: "Provider not found",
    });
  });

  it("returns an opaque 500 and leaks nothing when the lookup throws", async () => {
    isProvisionedProviderEmailMock.mockRejectedValue(
      new Error(`lookup failed for ${KNOWN_EMAIL} in provider_db`),
    );
    const server = await buildServer();

    const response = await post(server, { email: KNOWN_EMAIL });

    expect(response.statusCode).toBe(500);
    expect(JSON.parse(response.body)).toEqual({
      message: "An unexpected error occurred",
    });
    expect(response.body).not.toContain(KNOWN_EMAIL);
    expect(response.body).not.toContain("provider_db");
  });
});

describe("POST /internal/check-provider-provisioned enumeration resistance", () => {
  it("gives a known and an unknown email indistinguishable rejections", async () => {
    // This route exists to answer exactly this question, so the only thing that
    // may differ between the two is the documented 200/404 — never the shape.
    isProvisionedProviderEmailMock.mockResolvedValue(false);
    const server = await buildServer();

    const known = await post(server, { email: KNOWN_EMAIL });
    const unknown = await post(server, { email: UNKNOWN_EMAIL });

    expect(known.statusCode).toBe(unknown.statusCode);
    expect(known.body).toBe(unknown.body);
    expect(known.headers["content-type"]).toBe(unknown.headers["content-type"]);
  });

  it("rate-limits per email rather than globally", async () => {
    const server = await buildServer();
    const target = uniqueEmail("target");

    // The limiter's ceiling is 30/min per email; exhausting one address must
    // leave a different one answerable.
    const responses = [];
    for (let i = 0; i < 31; i += 1) {
      // eslint-disable-next-line no-await-in-loop
      responses.push(await post(server, { email: target }));
    }

    expect(responses.at(-1)?.statusCode).toBe(429);
    expect(
      (await post(server, { email: uniqueEmail("other") })).statusCode,
    ).toBe(200);
  });
});
