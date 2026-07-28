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

import { generateKeyPairSync } from "node:crypto";

import { createSigner } from "fast-jwt";
import Fastify from "fastify";
import { beforeEach, describe, expect, test, vi } from "vitest";

import { AuthorizedUserProfile } from "~@jii/auth";
import {
  checkDemoResidentsRoster,
  checkResidentsRoster,
  getRecidivizUserProfile,
} from "~@jii/trpc";

import { registerAuthRoutes } from "./routes";
import { checkAdminPanelPermissions } from "./staffUsers";

vi.mock("~@jii/trpc", () => ({
  checkDemoResidentsRoster: vi.fn(),
  checkResidentsRoster: vi.fn(),
  getRecidivizUserProfile: vi.fn(),
}));
vi.mock("./staffUsers", () => ({
  checkAdminPanelPermissions: vi.fn(),
}));

function generateRsaKeyPair() {
  return generateKeyPairSync("rsa", {
    modulusLength: 2048,
    publicKeyEncoding: { type: "spki", format: "pem" },
    privateKeyEncoding: { type: "pkcs8", format: "pem" },
  });
}

const { publicKey, privateKey } = generateRsaKeyPair();
const sign = createSigner({ key: privateKey, algorithm: "RS256" });

function buildTestServer() {
  const server = Fastify();
  registerAuthRoutes(server);
  return server;
}

let testServer: ReturnType<typeof buildTestServer>;

beforeEach(() => {
  vi.stubEnv("AUTH0_PUBLIC_KEY", publicKey);
  testServer = buildTestServer();
});

const url = "/api/v1/auth0-roster-check";

describe("GET /api/v1/auth0-roster-check", () => {
  test("returns 401 when no token is provided", async () => {
    const response = await testServer.inject({ method: "GET", url });

    expect(response.statusCode).toBe(401);
    expect(JSON.parse(response.body)).toEqual({
      error: "Your credentials are invalid",
    });
  });

  test("returns 401 when the token is signed with the wrong key", async () => {
    const { privateKey: wrongKey } = generateRsaKeyPair();
    const token = createSigner({ key: wrongKey, algorithm: "RS256" })({
      userType: "RECIDIVIZ",
      email: "test@recidiviz.org",
    });

    const response = await testServer.inject({
      method: "GET",
      url,
      headers: { authorization: `Bearer ${token}` },
    });

    expect(response.statusCode).toBe(401);
    expect(JSON.parse(response.body)).toEqual({
      error: "Your credentials are invalid",
    });
  });

  test("returns 401 when the payload doesn't match the schema", async () => {
    const token = sign({ userType: "UNKNOWN" });

    const response = await testServer.inject({
      method: "GET",
      url,
      headers: { authorization: `Bearer ${token}` },
    });

    expect(response.statusCode).toBe(401);
    expect(JSON.parse(response.body)).toEqual({
      error: "Your credentials contain invalid identity data",
    });
  });

  describe("RECIDIVIZ users", () => {
    test("returns the user profile", async () => {
      vi.mocked(getRecidivizUserProfile).mockResolvedValue({
        stateCode: "RECIDIVIZ",
        allowedStates: ["US_OZ"],
        permissions: ["enhanced"],
      });
      const token = sign({
        userType: "RECIDIVIZ",
        email: "test@recidiviz.org",
      });

      const response = await testServer.inject({
        method: "GET",
        url,
        headers: { authorization: `Bearer ${token}` },
      });

      expect(response.statusCode).toBe(200);
      expect(JSON.parse(response.body)).toEqual({
        userProfile: {
          stateCode: "RECIDIVIZ",
          allowedStates: ["US_OZ"],
          permissions: ["enhanced"],
        },
      });
      expect(getRecidivizUserProfile).toHaveBeenCalledWith(
        "test@recidiviz.org",
      );
    });
  });

  describe("ORIJIN users", () => {
    const orijinProfile: AuthorizedUserProfile = {
      stateCode: "US_OZ",
      externalId: "abc123",
      pseudonymizedId: "p123",
      permissions: ["live_data"],
    };

    test("returns the live roster profile when found", async () => {
      vi.mocked(checkResidentsRoster).mockResolvedValue(orijinProfile);
      const token = sign({
        userType: "ORIJIN",
        userId: "abc123",
        stateCode: "US_OZ",
      });

      const response = await testServer.inject({
        method: "GET",
        url,
        headers: { authorization: `Bearer ${token}` },
      });

      expect(response.statusCode).toBe(200);
      expect(JSON.parse(response.body)).toEqual({
        userProfile: orijinProfile,
      });
      expect(checkDemoResidentsRoster).not.toHaveBeenCalled();
    });

    test("falls back to the demo roster when not on the live roster", async () => {
      vi.mocked(checkResidentsRoster).mockResolvedValue(undefined);
      vi.mocked(checkDemoResidentsRoster).mockResolvedValue({
        stateCode: "US_OZ",
        externalId: "abc123",
        pseudonymizedId: "p123",
        permissions: [],
      });
      const token = sign({
        userType: "ORIJIN",
        userId: "abc123",
        stateCode: "US_OZ",
      });

      const response = await testServer.inject({
        method: "GET",
        url,
        headers: { authorization: `Bearer ${token}` },
      });

      expect(response.statusCode).toBe(200);
      expect(JSON.parse(response.body)).toEqual({
        userProfile: {
          stateCode: "US_OZ",
          externalId: "abc123",
          pseudonymizedId: "p123",
          permissions: [],
        },
      });
    });

    test("returns 404 when not found on either roster", async () => {
      vi.mocked(checkResidentsRoster).mockResolvedValue(undefined);
      vi.mocked(checkDemoResidentsRoster).mockResolvedValue(undefined);
      const token = sign({
        userType: "ORIJIN",
        userId: "abc123",
        stateCode: "US_OZ",
      });

      const response = await testServer.inject({
        method: "GET",
        url,
        headers: { authorization: `Bearer ${token}` },
      });

      expect(response.statusCode).toBe(404);
      expect(JSON.parse(response.body)).toEqual({ error: "User not found" });
    });
  });

  describe("STATE users", () => {
    test("returns the admin panel profile when found", async () => {
      vi.mocked(checkAdminPanelPermissions).mockResolvedValue({
        stateCode: "US_OZ",
        district: "D1",
        permissions: ["enhanced"],
      });
      const token = sign({ userType: "STATE", email: "test@state.gov" });

      const response = await testServer.inject({
        method: "GET",
        url,
        headers: { authorization: `Bearer ${token}` },
      });

      expect(response.statusCode).toBe(200);
      expect(checkAdminPanelPermissions).toHaveBeenCalledWith("test@state.gov");
    });

    test("returns 404 when not found", async () => {
      vi.mocked(checkAdminPanelPermissions).mockResolvedValue(undefined);
      const token = sign({ userType: "STATE", email: "test@state.gov" });

      const response = await testServer.inject({
        method: "GET",
        url,
        headers: { authorization: `Bearer ${token}` },
      });

      expect(response.statusCode).toBe(404);
      expect(JSON.parse(response.body)).toEqual({ error: "User not found" });
    });
  });
});
