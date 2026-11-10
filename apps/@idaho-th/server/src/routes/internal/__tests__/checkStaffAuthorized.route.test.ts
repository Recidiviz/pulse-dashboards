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

const isRecidivizStaffAuthorizedMock = vi.hoisted(() => vi.fn());

vi.mock("~@idaho-th/trpc/auth/isRecidivizStaffAuthorized", () => ({
  isRecidivizStaffAuthorized: isRecidivizStaffAuthorizedMock,
}));

import { registerCheckStaffAuthorizedRoute } from "~@idaho-th/server/routes/internal/checkStaffAuthorized";
import {
  SIGNED_WEBHOOK_ROUTES,
  WEBHOOK_SIGNATURE_HEADER,
} from "~@idaho-th/trpc/auth/webhookSignature";

import {
  buildSignedWebhookServer,
  signedHeaders,
  WEBHOOK_SECRET,
} from "./signedWebhook.helpers";

const ROUTE = SIGNED_WEBHOOK_ROUTES.checkStaffAuthorized;
const GRANTED_EMAIL = "granted@recidiviz.org";

/** Unique per call so the shared per-email rate limiter never blocks a test. */
let emailCounter = 0;
function uniqueEmail(prefix: string) {
  emailCounter += 1;
  return `${prefix}+${emailCounter}@recidiviz.org`;
}

beforeEach(() => {
  vi.clearAllMocks();
  process.env["BACKEND_WEBHOOK_SECRET"] = WEBHOOK_SECRET;
  isRecidivizStaffAuthorizedMock.mockReturnValue(true);
});

afterEach(() => {
  delete process.env["BACKEND_WEBHOOK_SECRET"];
});

async function buildServer() {
  return buildSignedWebhookServer(registerCheckStaffAuthorizedRoute);
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

describe("POST /internal/check-staff-authorized auth gate", () => {
  it("rejects before any authorization work when the signature is invalid", async () => {
    const server = await buildServer();

    const response = await post(
      server,
      { email: uniqueEmail("staffer") },
      { [WEBHOOK_SIGNATURE_HEADER]: "a".repeat(64) },
    );

    expect(response.statusCode).toBe(401);
    expect(isRecidivizStaffAuthorizedMock).not.toHaveBeenCalled();
  });

  it("rejects a signature bound to the link-staff route", async () => {
    const server = await buildServer();
    const rawBody = JSON.stringify({ email: uniqueEmail("staffer") });

    const response = await server.inject({
      method: "POST",
      url: ROUTE,
      headers: signedHeaders({
        route: ROUTE,
        rawBody,
        signWith: { route: SIGNED_WEBHOOK_ROUTES.linkStaff },
      }),
      payload: rawBody,
    });

    expect(response.statusCode).toBe(401);
    expect(isRecidivizStaffAuthorizedMock).not.toHaveBeenCalled();
  });
});

describe("POST /internal/check-staff-authorized input validation", () => {
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
    expect(isRecidivizStaffAuthorizedMock).not.toHaveBeenCalled();
  });
});

describe("POST /internal/check-staff-authorized decision", () => {
  it("returns 200 with authorized: true for a granted address", async () => {
    const server = await buildServer();
    const email = uniqueEmail("granted");

    const response = await post(server, { email });

    expect(response.statusCode).toBe(200);
    expect(JSON.parse(response.body)).toEqual({ authorized: true });
    expect(isRecidivizStaffAuthorizedMock).toHaveBeenCalledTimes(1);
    expect(isRecidivizStaffAuthorizedMock).toHaveBeenCalledWith(email);
  });

  it("returns 403 with no authorized field for an address with no grant", async () => {
    // The Action reads an absent or false field as a denial, so the body must
    // never carry a truthy authorized value on this path.
    isRecidivizStaffAuthorizedMock.mockReturnValue(false);
    const server = await buildServer();

    const response = await post(server, { email: uniqueEmail("ungranted") });

    expect(response.statusCode).toBe(403);
    expect(JSON.parse(response.body)).toEqual({
      message: "Staff not authorized",
    });
  });

  it("returns an opaque 500 and leaks nothing when the lookup throws", async () => {
    isRecidivizStaffAuthorizedMock.mockImplementation(() => {
      throw new Error(`allowlist read failed for ${GRANTED_EMAIL}`);
    });
    const server = await buildServer();

    const response = await post(server, { email: GRANTED_EMAIL });

    expect(response.statusCode).toBe(500);
    expect(JSON.parse(response.body)).toEqual({
      message: "An unexpected error occurred",
    });
    expect(response.body).not.toContain(GRANTED_EMAIL);
  });
});
