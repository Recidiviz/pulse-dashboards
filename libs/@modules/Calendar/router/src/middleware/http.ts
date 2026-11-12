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

import { initTRPC } from "@trpc/server";
import type { FastifyReply, FastifyRequest } from "fastify";

/** The request and reply the Fastify tRPC adapter puts on every context. */
export interface HttpContext {
  req: FastifyRequest;
  res: FastifyReply;
}

/**
 * A tRPC instance of its own for middleware that needs only the request and
 * reply. A procedure from any instance whose context has them takes this
 * middleware with .concat(), as procedures take procedurePlugin from
 * ~server-setup-plugin.
 */
export const http = initTRPC.context<HttpContext>().create();
