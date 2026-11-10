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

import type { FastifyInstance, FastifyReply, FastifyRequest } from "fastify";

// Under /api so the load balancer's "/api/*" path rule routes it to this
// service — everything outside that prefix goes to the frontend instead.
export const HEALTH_ROUTE_PATH = "/api/health";

export function registerHealthRoute(server: FastifyInstance) {
  server.get(
    HEALTH_ROUTE_PATH,
    { logLevel: "silent" },
    (_req: FastifyRequest, reply: FastifyReply) => {
      return reply.code(200).send({ status: "ok" });
    },
  );
}
