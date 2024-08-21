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

import { trpcMiddleware } from "@sentry/node";
import { initTRPC, TRPCError } from "@trpc/server";
import superjson from "superjson";

import { createContext } from "~sentencing-server/trpc/context";

export const t = initTRPC
  .context<typeof createContext>()
  // Required to get Date objects to serialize correctly.
  .create({ transformer: superjson });

export const router = t.router;

/*
 * Base procedure that:
 * - Attaches the RPC input to the context so that sentry can log it
 * - Checks if the request is authorized by Auth0
 */
export const baseProcedure = t.procedure
  .use(async (opts) => {
    trpcMiddleware({
      attachRpcInput: true,
    });

    return opts.next();
  })
  .use(async (opts) => {
    const { ctx } = opts;
    if (!ctx.auth0Authorized) {
      throw new TRPCError({ code: "UNAUTHORIZED" });
    }
    return opts.next();
  });
