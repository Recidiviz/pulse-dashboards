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

// Required to get the "request.jwtVerify" decorator to be recognized by typescript
import "@fastify/jwt";

import { trpcMiddleware } from "@sentry/node";
import { initTRPC, TRPCError } from "@trpc/server";
import type { CreateFastifyContextOptions } from "@trpc/server/adapters/fastify";

export async function getIsAuth0Authorized(opts: CreateFastifyContextOptions) {
  const { req } = opts;
  let auth0Authorized;

  // Check if the request is authorized by Auth0
  try {
    if (req.headers.authorization) {
      // Auth is set up in index.ts with fastifyAuth0Verify, which uses @fastify/jwt
      // under the hood and exposes this decorator
      await req.jwtVerify();
      auth0Authorized = true;
    } else {
      auth0Authorized = false;
    }
  } catch {
    auth0Authorized = false;
  }

  return auth0Authorized;
}

export function procedurePlugin() {
  const t = initTRPC
    .context<{
      auth0Authorized: boolean;
    }>()
    .create();

  return {
    procedure: t.procedure
      .use(
        trpcMiddleware({
          attachRpcInput: true,
        }),
      )
      .use(async (opts) => {
        const { ctx } = opts;
        if (!ctx.auth0Authorized) {
          throw new TRPCError({ code: "UNAUTHORIZED" });
        }
        return opts.next();
      }),
  };
}
