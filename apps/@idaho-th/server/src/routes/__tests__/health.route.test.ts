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

import Fastify, { type FastifyInstance } from "fastify";
import { afterEach, beforeEach, describe, expect, it } from "vitest";

import {
  HEALTH_ROUTE_PATH,
  registerHealthRoute,
} from "~@idaho-th/server/routes/health";

let server: FastifyInstance;

beforeEach(() => {
  server = Fastify();
  registerHealthRoute(server);
});

afterEach(async () => {
  await server.close();
});

describe("health route", () => {
  it("responds 200 with a plain ok status", async () => {
    const response = await server.inject({
      method: "GET",
      url: HEALTH_ROUTE_PATH,
    });

    expect(response.statusCode).toBe(200);
    expect(response.json()).toEqual({ status: "ok" });
  });

  it("does not expose a root health route", async () => {
    const response = await server.inject({
      method: "GET",
      url: "/health",
    });

    expect(response.statusCode).toBe(404);
  });
});
