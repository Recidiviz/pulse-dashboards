// Recidiviz - a data platform for criminal justice reform
// Copyright (C) 2025 Recidiviz, Inc.
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

import Fastify from "fastify";

import { EDOVO_SIGNING_KEY } from "./keys/public";

const fastify = Fastify({
  logger: true,
});

/**
 * This endpoint simulates the Edovo API endpoint where we retrieve the verification key
 * for their signed JWT. It returns a different key that is for local use only, and unlike
 * the real endpoint it does not verify the API key (there would be no point to this really,
 * we would just be comparing our own secret value to itself).
 */
fastify.get("/edovo-jwks", async () => {
  return { keys: [EDOVO_SIGNING_KEY] };
});

const start = async () => {
  try {
    await fastify.listen({ port: 3003 });
  } catch (err) {
    fastify.log.error(err);
    process.exit(1);
  }
};
start();
