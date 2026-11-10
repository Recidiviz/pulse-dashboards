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

const linkHousingProviderMock = vi.hoisted(() => vi.fn());
const syncProviderContactBestEffortMock = vi.hoisted(() => vi.fn());
const getPrismaClientForStateCodeMock = vi.hoisted(() => vi.fn());

// LINK_PROVIDER_STATUS must stay real: the route switches on it.
vi.mock("~@idaho-th/trpc/auth/linkHousingProvider", async (importOriginal) => ({
  ...(await importOriginal<
    typeof import("~@idaho-th/trpc/auth/linkHousingProvider")
  >()),
  linkHousingProvider: linkHousingProviderMock,
}));

vi.mock("~@idaho-th/trpc/intercom/intercom.provider.sync", () => ({
  syncProviderContactBestEffort: syncProviderContactBestEffortMock,
}));

vi.mock("~@idaho-th/prisma", () => ({
  getPrismaClientForStateCode: getPrismaClientForStateCodeMock,
}));

import { registerLinkProviderRoute } from "~@idaho-th/server/routes/internal/linkProvider";
import { LINK_PROVIDER_STATUS } from "~@idaho-th/trpc/auth/linkHousingProvider";
import {
  SIGNED_WEBHOOK_ROUTES,
  WEBHOOK_SIGNATURE_HEADER,
} from "~@idaho-th/trpc/auth/webhookSignature";

import {
  buildSignedWebhookServer,
  signedHeaders,
  WEBHOOK_SECRET,
} from "./signedWebhook.helpers";

const ROUTE = SIGNED_WEBHOOK_ROUTES.linkProvider;
const KNOWN_EMAIL = "provider@example.com";
const UNKNOWN_EMAIL = "unknown@example.com";
const PSEUDONYMIZED_ID = "provider-pseudo-1";
/** A HousingProviderUser id — the person, never the organization. */
const PROVIDER_USER_ID = "provider-user-1";

/** Unique per call so the shared rate limiter never conflates two tests. */
let auth0SubCounter = 0;
function nextAuth0Sub() {
  auth0SubCounter += 1;
  return `auth0|provider-${auth0SubCounter}`;
}

function linkedResult() {
  return {
    status: LINK_PROVIDER_STATUS.LINKED,
    providerUserId: PROVIDER_USER_ID,
    pseudonymizedId: PSEUDONYMIZED_ID,
    email: KNOWN_EMAIL,
    name: "Jane Doe",
    intercomSyncedAt: null,
  };
}

beforeEach(() => {
  vi.clearAllMocks();
  process.env["BACKEND_WEBHOOK_SECRET"] = WEBHOOK_SECRET;
  getPrismaClientForStateCodeMock.mockReturnValue({});
  linkHousingProviderMock.mockResolvedValue(linkedResult());
  syncProviderContactBestEffortMock.mockResolvedValue({ status: "synced" });
});

afterEach(() => {
  delete process.env["BACKEND_WEBHOOK_SECRET"];
});

async function buildServer() {
  return buildSignedWebhookServer(registerLinkProviderRoute);
}

type Body = Record<string, unknown>;

async function post(
  server: FastifyInstance,
  body: Body,
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

function validBody(email = KNOWN_EMAIL): Body {
  return {
    email,
    auth0Sub: nextAuth0Sub(),
    pseudonymizedId: PSEUDONYMIZED_ID,
  };
}

describe("POST /internal/link-provider auth gate", () => {
  it("rejects before any DB work when the signature is invalid", async () => {
    const server = await buildServer();

    const response = await post(server, validBody(), {
      [WEBHOOK_SIGNATURE_HEADER]: "a".repeat(64),
    });

    expect(response.statusCode).toBe(401);
    expect(getPrismaClientForStateCodeMock).not.toHaveBeenCalled();
    expect(linkHousingProviderMock).not.toHaveBeenCalled();
  });

  it("rejects before any DB work when the secret is wrong", async () => {
    const server = await buildServer();
    const body = validBody();
    const rawBody = JSON.stringify(body);

    const response = await server.inject({
      method: "POST",
      url: ROUTE,
      headers: signedHeaders({ route: ROUTE, rawBody, secret: "wrong" }),
      payload: rawBody,
    });

    expect(response.statusCode).toBe(401);
    expect(linkHousingProviderMock).not.toHaveBeenCalled();
  });
});

describe("POST /internal/link-provider input validation", () => {
  it.each([
    ["a malformed email", { email: "not-an-email" }],
    ["a missing email", { email: undefined }],
    ["a blank auth0Sub", { auth0Sub: "   " }],
    ["a blank pseudonymizedId", { pseudonymizedId: "" }],
  ])("returns 400 for %s before the lookup", async (_label, overrides) => {
    const server = await buildServer();

    const response = await post(server, { ...validBody(), ...overrides });

    expect(response.statusCode).toBe(400);
    expect(JSON.parse(response.body)).toEqual({
      message: "Invalid request body",
    });
    expect(linkHousingProviderMock).not.toHaveBeenCalled();
  });
});

describe("POST /internal/link-provider happy path", () => {
  it("links once and returns the canonical pseudonymizedId", async () => {
    const server = await buildServer();
    const body = validBody();

    const response = await post(server, body);

    expect(response.statusCode).toBe(200);
    expect(JSON.parse(response.body)).toEqual({
      success: true,
      pseudonymizedId: PSEUDONYMIZED_ID,
    });
    expect(linkHousingProviderMock).toHaveBeenCalledTimes(1);
    expect(linkHousingProviderMock).toHaveBeenCalledWith(expect.anything(), {
      email: KNOWN_EMAIL,
      auth0Sub: body["auth0Sub"],
      pseudonymizedId: PSEUDONYMIZED_ID,
    });
  });

  it("syncs the Intercom contact for the person, with their own name and email", async () => {
    const server = await buildServer();

    await post(server, validBody());

    expect(syncProviderContactBestEffortMock).toHaveBeenCalledWith(
      expect.objectContaining({
        providerUserId: PROVIDER_USER_ID,
        provider: expect.objectContaining({
          email: KNOWN_EMAIL,
          name: "Jane Doe",
        }),
      }),
    );
  });

  it("still succeeds when the Intercom sync fails", async () => {
    syncProviderContactBestEffortMock.mockResolvedValue({
      status: "failed",
      code: "rate_limited",
    });
    const server = await buildServer();

    expect((await post(server, validBody())).statusCode).toBe(200);
  });

  it.each(["disabled", "ineligible", "synced"])(
    "succeeds for an Intercom %s result",
    async (status) => {
      syncProviderContactBestEffortMock.mockResolvedValue({ status });
      const server = await buildServer();

      expect((await post(server, validBody())).statusCode).toBe(200);
    },
  );

  it("treats already_linked as a success", async () => {
    linkHousingProviderMock.mockResolvedValue({
      ...linkedResult(),
      status: LINK_PROVIDER_STATUS.ALREADY_LINKED,
    });
    const server = await buildServer();

    expect((await post(server, validBody())).statusCode).toBe(200);
  });
});

describe("POST /internal/link-provider failure paths", () => {
  it("returns 404 for an unprovisioned email", async () => {
    linkHousingProviderMock.mockResolvedValue({
      status: LINK_PROVIDER_STATUS.NOT_FOUND,
    });
    const server = await buildServer();

    const response = await post(server, validBody(UNKNOWN_EMAIL));

    expect(response.statusCode).toBe(404);
    expect(JSON.parse(response.body)).toEqual({
      message: "Provider not found",
    });
  });

  it("returns 409 when the provider belongs to another identity", async () => {
    linkHousingProviderMock.mockResolvedValue({
      status: LINK_PROVIDER_STATUS.CONFLICT,
      providerUserId: PROVIDER_USER_ID,
    });
    const server = await buildServer();

    const response = await post(server, validBody());

    expect(response.statusCode).toBe(409);
    expect(JSON.parse(response.body)).toEqual({
      message: "Provider already linked to another account",
    });
  });

  it("returns an opaque 500 when the response fails its own schema", async () => {
    linkHousingProviderMock.mockResolvedValue({
      ...linkedResult(),
      pseudonymizedId: "",
    });
    const server = await buildServer();

    const response = await post(server, validBody());

    expect(response.statusCode).toBe(500);
    expect(JSON.parse(response.body)).toEqual({
      message: "An unexpected error occurred",
    });
  });

  it("returns an opaque 500 and leaks nothing when the service throws", async () => {
    linkHousingProviderMock.mockRejectedValue(
      new Error(`connection to provider_db failed for ${KNOWN_EMAIL}`),
    );
    const server = await buildServer();

    const response = await post(server, validBody());

    expect(response.statusCode).toBe(500);
    expect(JSON.parse(response.body)).toEqual({
      message: "An unexpected error occurred",
    });
    expect(response.body).not.toContain(KNOWN_EMAIL);
    expect(response.body).not.toContain("provider_db");
  });
});

describe("POST /internal/link-provider enumeration resistance", () => {
  it("gives a known and an unknown email indistinguishable rejections", async () => {
    // Both must look the same to a caller that already holds the secret but is
    // probing which addresses are provisioned.
    linkHousingProviderMock.mockResolvedValue({
      status: LINK_PROVIDER_STATUS.NOT_FOUND,
    });
    const server = await buildServer();

    const known = await post(server, validBody(KNOWN_EMAIL));
    const unknown = await post(server, validBody(UNKNOWN_EMAIL));

    expect(known.statusCode).toBe(unknown.statusCode);
    expect(known.body).toBe(unknown.body);
    expect(known.headers["content-type"]).toBe(unknown.headers["content-type"]);
  });
});

describe("POST /internal/link-provider best-effort Intercom sync", () => {
  it("still returns 200 when the sync fails without naming a cause", () => {
    // The failure is logged with `cause` only when the result carries a code;
    // a code-less failure must still not block the login.
    syncProviderContactBestEffortMock.mockResolvedValue({
      status: "failed",
      providerUserId: PROVIDER_USER_ID,
    });

    return buildServer()
      .then((server) => post(server, validBody()))
      .then((response) => {
        expect(response.statusCode).toBe(200);
        expect(JSON.parse(response.body)).toEqual({
          success: true,
          pseudonymizedId: PSEUDONYMIZED_ID,
        });
      });
  });

  it("does not reach Intercom at all when no provider matched", async () => {
    linkHousingProviderMock.mockResolvedValue({
      status: LINK_PROVIDER_STATUS.NOT_FOUND,
    });
    const server = await buildServer();

    await post(server, validBody(UNKNOWN_EMAIL));

    expect(syncProviderContactBestEffortMock).not.toHaveBeenCalled();
  });
});

describe("POST /internal/link-provider rate limiting", () => {
  it("returns 429 with Retry-After once one subject exhausts its budget", async () => {
    // Keyed on auth0Sub, so a single caller cannot lock out the whole tenant.
    const server = await buildServer();
    const auth0Sub = `auth0|provider-ratelimit-${Date.now()}`;
    let lastStatus = 0;
    let retryAfter: string | undefined;

    // The limiter allows 20 requests per minute per subject.
    for (let attempt = 0; attempt < 21; attempt += 1) {
      // eslint-disable-next-line no-await-in-loop -- the limit is sequential
      const response = await post(server, {
        email: KNOWN_EMAIL,
        auth0Sub,
        pseudonymizedId: PSEUDONYMIZED_ID,
      });
      lastStatus = response.statusCode;
      retryAfter = response.headers["retry-after"] as string | undefined;
    }

    expect(lastStatus).toBe(429);
    expect(Number(retryAfter)).toBeGreaterThan(0);
    // The 21st request never reached the service.
    expect(linkHousingProviderMock).toHaveBeenCalledTimes(20);
  });
});
