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

import { FastifyInstance } from "fastify";

/**
 * Marks every response as uncacheable unless its route already set a Cache-Control header.
 *
 * Firebase Hosting fronts this server, and its CDN caches any 404 without a Cache-Control
 * header for 10 minutes, keyed on the URL alone. Request headers such as Authorization and
 * StateCode are not part of that key, so one user's 404 would be served to everyone else
 * who requests the same URL.
 */
export function registerNoStoreHook(server: FastifyInstance) {
  server.addHook("onSend", async (_request, reply) => {
    if (!reply.hasHeader("Cache-Control")) {
      reply.header("Cache-Control", "no-store");
    }
  });
}
