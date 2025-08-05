// Recidiviz - a data platform for criminal justice reform
// Copyright (C) 2024 Recidiviz, Inc.
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
import { CreateFastifyContextOptions } from "@trpc/server/adapters/fastify";
import { createVerifier } from "fast-jwt";
import superjson from "superjson";

import {
  procedurePlugin,
  verifyAuth0Token,
  verifyJwtToken,
} from "~server-setup-plugin/trpc";

const plugin = procedurePlugin();

// Auth0 TRPC initialization
export async function createAuth0Context(opts: CreateFastifyContextOptions) {
  const { req, res } = opts;
  const authPayload = await verifyAuth0Token(opts);

  return {
    req,
    res,
    isAuthorized: !!authPayload,
  };
}

const auth0Root = initTRPC
  .context<typeof createAuth0Context>()
  // Required to get Date objects to serialize correctly.
  .create({ transformer: superjson });

const auth0Router = auth0Root.router;

const auth0baseProcedure = auth0Root.procedure.concat(plugin.procedure);

export const testAuth0Router = auth0Router({
  // A procedure that does nothing, but is used to test that the base procedure auth checks are running.
  test: auth0baseProcedure.query(async () => {
    return "Hello, world!";
  }),
});

export type Auth0AppRouter = typeof testAuth0Router;

// Jwt TRPC initialization

const verifier = createVerifier({
  key: "0d9e4eb91b3bc1ad85a6f39c7070a6dc30c003da1eb83d86e8fdabdb4e96761f",
});

export async function createJwtContext(opts: CreateFastifyContextOptions) {
  const { req, res } = opts;
  const authPayload = await verifyJwtToken(opts, verifier);

  return {
    req,
    res,
    isAuthorized: !!authPayload,
  };
}

const jwtRoot = initTRPC
  .context<typeof createJwtContext>()
  // Required to get Date objects to serialize correctly.
  .create({ transformer: superjson });

const jwtRouter = jwtRoot.router;

const jwtbaseProcedure = jwtRoot.procedure.concat(plugin.procedure);

export const testJwtRouter = jwtRouter({
  // A procedure that does nothing, but is used to test that the base procedure auth checks are running.
  test: jwtbaseProcedure.query(async () => {
    return "Hello, world!";
  }),
});

export type JwtAppRouter = typeof testJwtRouter;
