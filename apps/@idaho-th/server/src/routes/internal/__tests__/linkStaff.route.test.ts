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

const upsertStaffAndSyncIntercomMock = vi.hoisted(() => vi.fn());
const getPrismaClientForStateCodeMock = vi.hoisted(() => vi.fn());

vi.mock("~@idaho-th/trpc/intercom/intercom.staff.sync", () => ({
  upsertStaffAndSyncIntercom: upsertStaffAndSyncIntercomMock,
}));

vi.mock("~@idaho-th/prisma", () => ({
  getPrismaClientForStateCode: getPrismaClientForStateCodeMock,
}));

import { registerLinkStaffRoute } from "~@idaho-th/server/routes/internal/linkStaff";
import {
  SIGNED_WEBHOOK_ROUTES,
  WEBHOOK_SIGNATURE_HEADER,
} from "~@idaho-th/trpc/auth/webhookSignature";

import {
  buildSignedWebhookServer,
  signedHeaders,
  WEBHOOK_SECRET,
} from "./signedWebhook.helpers";

const ROUTE = SIGNED_WEBHOOK_ROUTES.linkStaff;
const STAFF_EMAIL = "staff@example.com";
const PSEUDONYMIZED_ID = "staff-pseudo-1";

/** Unique per call so the shared rate limiter never conflates two tests. */
let auth0SubCounter = 0;
function nextAuth0Sub() {
  auth0SubCounter += 1;
  return `auth0|staff-${auth0SubCounter}`;
}

function validBody(): Record<string, unknown> {
  return {
    email: STAFF_EMAIL,
    auth0Sub: nextAuth0Sub(),
    pseudonymizedId: PSEUDONYMIZED_ID,
  };
}

beforeEach(() => {
  vi.clearAllMocks();
  process.env["BACKEND_WEBHOOK_SECRET"] = WEBHOOK_SECRET;
  getPrismaClientForStateCodeMock.mockReturnValue({});
  upsertStaffAndSyncIntercomMock.mockResolvedValue({
    status: "synced",
    staffId: "staff-1",
    pseudonymizedId: PSEUDONYMIZED_ID,
  });
});

afterEach(() => {
  delete process.env["BACKEND_WEBHOOK_SECRET"];
});

async function buildServer() {
  return buildSignedWebhookServer(registerLinkStaffRoute);
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

describe("POST /internal/link-staff auth gate", () => {
  it("rejects before any DB work when the signature is invalid", async () => {
    const server = await buildServer();

    const response = await post(server, validBody(), {
      [WEBHOOK_SIGNATURE_HEADER]: "a".repeat(64),
    });

    expect(response.statusCode).toBe(401);
    expect(getPrismaClientForStateCodeMock).not.toHaveBeenCalled();
    expect(upsertStaffAndSyncIntercomMock).not.toHaveBeenCalled();
  });

  it("rejects a signature bound to the link-provider route", async () => {
    const server = await buildServer();
    const rawBody = JSON.stringify(validBody());

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
    expect(upsertStaffAndSyncIntercomMock).not.toHaveBeenCalled();
  });
});

describe("POST /internal/link-staff input validation", () => {
  it.each([
    ["a malformed email", { email: "not-an-email" }],
    ["a blank auth0Sub", { auth0Sub: "  " }],
    ["a blank pseudonymizedId", { pseudonymizedId: "" }],
  ])("returns 400 for %s before the upsert", async (_label, overrides) => {
    const server = await buildServer();

    const response = await post(server, { ...validBody(), ...overrides });

    expect(response.statusCode).toBe(400);
    expect(JSON.parse(response.body)).toEqual({
      message: "Invalid request body",
    });
    expect(upsertStaffAndSyncIntercomMock).not.toHaveBeenCalled();
  });
});

describe("POST /internal/link-staff outcomes", () => {
  it("returns the canonical pseudonymizedId on success", async () => {
    const server = await buildServer();

    const response = await post(server, validBody());

    expect(response.statusCode).toBe(200);
    expect(JSON.parse(response.body)).toEqual({
      success: true,
      pseudonymizedId: PSEUDONYMIZED_ID,
    });
    expect(upsertStaffAndSyncIntercomMock).toHaveBeenCalledTimes(1);
    expect(upsertStaffAndSyncIntercomMock).toHaveBeenCalledWith({
      prisma: expect.anything(),
      email: STAFF_EMAIL,
      pseudonymizedId: PSEUDONYMIZED_ID,
    });
  });

  it("returns the adopted identity when an existing staff row wins", async () => {
    upsertStaffAndSyncIntercomMock.mockResolvedValue({
      status: "synced",
      staffId: "staff-1",
      pseudonymizedId: "existing-staff-pseudo",
    });
    const server = await buildServer();

    const response = await post(server, validBody());

    expect(JSON.parse(response.body)).toEqual({
      success: true,
      pseudonymizedId: "existing-staff-pseudo",
    });
  });

  it.each(["failed", "disabled", "synced"])(
    "still returns 200 for an Intercom %s result, so login is never blocked",
    async (status) => {
      upsertStaffAndSyncIntercomMock.mockResolvedValue({
        status,
        staffId: "staff-1",
        pseudonymizedId: PSEUDONYMIZED_ID,
      });
      const server = await buildServer();

      expect((await post(server, validBody())).statusCode).toBe(200);
    },
  );

  it("returns 409 when the email belongs to another account", async () => {
    upsertStaffAndSyncIntercomMock.mockResolvedValue({ status: "conflict" });
    const server = await buildServer();

    const response = await post(server, validBody());

    expect(response.statusCode).toBe(409);
    expect(JSON.parse(response.body)).toEqual({
      message: "Staff email already linked to another account",
    });
  });

  it("returns an opaque 500 when the response fails its own schema", async () => {
    upsertStaffAndSyncIntercomMock.mockResolvedValue({
      status: "synced",
      staffId: "staff-1",
      pseudonymizedId: "",
    });
    const server = await buildServer();

    const response = await post(server, validBody());

    expect(response.statusCode).toBe(500);
    expect(JSON.parse(response.body)).toEqual({
      message: "An unexpected error occurred",
    });
  });

  it("returns an opaque 500 and leaks nothing when the upsert throws", async () => {
    upsertStaffAndSyncIntercomMock.mockRejectedValue(
      new Error(`staff_db write failed for ${STAFF_EMAIL}`),
    );
    const server = await buildServer();

    const response = await post(server, validBody());

    expect(response.statusCode).toBe(500);
    expect(response.body).not.toContain(STAFF_EMAIL);
    expect(response.body).not.toContain("staff_db");
  });
});

describe("POST /internal/link-staff rate limiting", () => {
  it("returns 429 with Retry-After once one subject exhausts its budget", async () => {
    // Keyed on auth0Sub, so a single caller cannot lock out every CM.
    const server = await buildServer();
    const auth0Sub = `auth0|staff-ratelimit-${Date.now()}`;
    let lastStatus = 0;
    let retryAfter: string | undefined;

    // The limiter allows 20 requests per minute per subject.
    for (let attempt = 0; attempt < 21; attempt += 1) {
      // eslint-disable-next-line no-await-in-loop -- the limit is sequential
      const response = await post(server, {
        email: STAFF_EMAIL,
        auth0Sub,
        pseudonymizedId: PSEUDONYMIZED_ID,
      });
      lastStatus = response.statusCode;
      retryAfter = response.headers["retry-after"] as string | undefined;
    }

    expect(lastStatus).toBe(429);
    expect(Number(retryAfter)).toBeGreaterThan(0);
    // The 21st request never reached the upsert.
    expect(upsertStaffAndSyncIntercomMock).toHaveBeenCalledTimes(20);
  });
});
