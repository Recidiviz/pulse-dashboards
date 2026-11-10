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

export type RequestWithRawBody = FastifyRequest & { rawBody?: string };

/**
 * Registers a JSON parser that preserves the raw request body on `req.rawBody`.
 * Required for HMAC webhook verification over the exact bytes Auth0 signed.
 *
 * Register inside an encapsulated Fastify context so this parser does not affect
 * global tRPC routes.
 */
export function registerSignedJsonWebhookParser(instance: FastifyInstance) {
  instance.addContentTypeParser(
    "application/json",
    { parseAs: "string" },
    (req, body, done) => {
      const raw = typeof body === "string" ? body : body.toString("utf8");
      (req as RequestWithRawBody).rawBody = raw;
      try {
        done(null, raw.length === 0 ? undefined : JSON.parse(raw));
      } catch {
        // Defer to schema validation below; surface a consistent 400.
        done(null, undefined);
      }
    },
  );
}

export function getSignedWebhookRawBody(req: FastifyRequest): string {
  return (req as RequestWithRawBody).rawBody ?? "";
}
