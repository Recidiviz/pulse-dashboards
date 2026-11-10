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

const isProvisionedStaffEmailMock = vi.hoisted(() => vi.fn());
const getPrismaClientForStateCodeMock = vi.hoisted(() => vi.fn());

vi.mock("~@idaho-th/trpc/auth/isProvisionedStaffEmail", () => ({
  isProvisionedStaffEmail: isProvisionedStaffEmailMock,
}));

vi.mock("~@idaho-th/prisma", () => ({
  getPrismaClientForStateCode: getPrismaClientForStateCodeMock,
}));

import { registerCheckRecidivizStaffRoute } from "~@idaho-th/server/routes/internal/checkRecidivizStaff";
import {
  SIGNED_WEBHOOK_ROUTES,
  WEBHOOK_SIGNATURE_HEADER,
} from "~@idaho-th/trpc/auth/webhookSignature";

import {
  buildSignedWebhookServer,
  signedHeaders,
  WEBHOOK_SECRET,
} from "./signedWebhook.helpers";

const ROUTE = SIGNED_WEBHOOK_ROUTES.checkRecidivizStaff;

/** Unique per call so the shared per-email rate limiter never blocks a test. */
let emailCounter = 0;
function uniqueEmail(prefix = "staff") {
  emailCounter += 1;
  return `${prefix}+${emailCounter}@recidiviz.org`;
}

beforeEach(() => {
  vi.clearAllMocks();
  process.env["BACKEND_WEBHOOK_SECRET"] = WEBHOOK_SECRET;
  getPrismaClientForStateCodeMock.mockReturnValue({});
  isProvisionedStaffEmailMock.mockResolvedValue(true);
});

afterEach(() => {
  delete process.env["BACKEND_WEBHOOK_SECRET"];
});

async function buildServer() {
  return buildSignedWebhookServer(registerCheckRecidivizStaffRoute);
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

describe("POST /internal/check-recidiviz-staff auth gate", () => {
  it("rejects before any DB work when the signature is invalid", async () => {
    const server = await buildServer();

    const response = await post(
      server,
      { email: uniqueEmail() },
      { [WEBHOOK_SIGNATURE_HEADER]: "a".repeat(64) },
    );

    expect(response.statusCode).toBe(401);
    expect(isProvisionedStaffEmailMock).not.toHaveBeenCalled();
  });

  it("rejects a signature minted for another route", async () => {
    const server = await buildServer();
    const body = { email: uniqueEmail() };
    const rawBody = JSON.stringify(body);

    const response = await server.inject({
      method: "POST",
      url: ROUTE,
      headers: signedHeaders({
        route: ROUTE,
        rawBody,
        signWith: { route: SIGNED_WEBHOOK_ROUTES.checkStaffAuthorized },
      }),
      payload: rawBody,
    });

    expect(response.statusCode).toBe(401);
    expect(isProvisionedStaffEmailMock).not.toHaveBeenCalled();
  });
});

describe("POST /internal/check-recidiviz-staff", () => {
  it("authorizes an address with a provisioned HousingStaff row", async () => {
    const server = await buildServer();
    const email = uniqueEmail();

    const response = await post(server, { email });

    expect(response.statusCode).toBe(200);
    expect(response.json()).toEqual({ authorized: true });
    expect(isProvisionedStaffEmailMock).toHaveBeenCalledWith({}, email);
  });

  it("denies with 403 and no authorized field when no row is provisioned", async () => {
    isProvisionedStaffEmailMock.mockResolvedValue(false);
    const server = await buildServer();

    const response = await post(server, { email: uniqueEmail() });

    expect(response.statusCode).toBe(403);
    expect(response.json()).not.toHaveProperty("authorized");
  });

  it("rejects a malformed body before touching the database", async () => {
    const server = await buildServer();

    const response = await post(server, { email: "not-an-email" });

    expect(response.statusCode).toBe(400);
    expect(isProvisionedStaffEmailMock).not.toHaveBeenCalled();
  });

  it("rejects a body with no email at all", async () => {
    const server = await buildServer();

    const response = await post(server, {});

    expect(response.statusCode).toBe(400);
    expect(isProvisionedStaffEmailMock).not.toHaveBeenCalled();
  });

  it("answers 500 without an authorized field when the lookup throws", async () => {
    isProvisionedStaffEmailMock.mockRejectedValue(new Error("db down"));
    const server = await buildServer();

    const response = await post(server, { email: uniqueEmail() });

    expect(response.statusCode).toBe(500);
    expect(response.json()).not.toHaveProperty("authorized");
  });

  it("does not replay a nonce", async () => {
    const server = await buildServer();
    const body = { email: uniqueEmail() };
    const rawBody = JSON.stringify(body);
    const headers = signedHeaders({ route: ROUTE, rawBody });

    const first = await server.inject({
      method: "POST",
      url: ROUTE,
      headers,
      payload: rawBody,
    });
    const replay = await server.inject({
      method: "POST",
      url: ROUTE,
      headers,
      payload: rawBody,
    });

    expect(first.statusCode).toBe(200);
    expect(replay.statusCode).toBe(401);
  });
});
