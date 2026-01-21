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

import { initTRPC, TRPCError } from "@trpc/server";
import { CreateFastifyContextOptions } from "@trpc/server/adapters/fastify";
import superjson from "superjson";

import {
  procedurePlugin,
  verifyFirebaseIdToken,
} from "~server-setup-plugin/trpc";

const plugin = procedurePlugin();

export async function createFirebaseContext(opts: CreateFastifyContextOptions) {
  const { req, res } = opts;
  const authPayload = await verifyFirebaseIdToken(req);

  return {
    req,
    res,
    authPayload,
  };
}

const fbRoot = initTRPC
  .context<typeof createFirebaseContext>()
  // Required to get Date objects to serialize correctly.
  .create({ transformer: superjson });

const fbRouter = fbRoot.router;

const fbBaseProcedure = fbRoot.procedure.concat(plugin).use((opts) => {
  const { ctx } = opts;
  if (!ctx.authPayload) {
    throw new TRPCError({ code: "UNAUTHORIZED" });
  }
  return opts.next();
});

export const testFbRouter = fbRouter({
  // A procedure that does nothing, but is used to test that the base procedure auth checks are running.
  test: fbBaseProcedure.query(async () => {
    return "Hello, world!";
  }),
});

export type FbAppRouter = typeof testFbRouter;
