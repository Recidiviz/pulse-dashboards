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
import superjson from "superjson";

import {
  getIsAuth0Authorized,
  procedurePlugin,
} from "~server-setup-plugin/trpc";

export async function createContext(opts: CreateFastifyContextOptions) {
  const { req, res } = opts;
  const auth0Authorized = await getIsAuth0Authorized(opts);

  return {
    req,
    res,
    auth0Authorized,
  };
}

const t = initTRPC
  .context<typeof createContext>()
  // Required to get Date objects to serialize correctly.
  .create({ transformer: superjson });

const router = t.router;

const plugin = procedurePlugin();

const baseProcedure = t.procedure.unstable_concat(plugin.procedure);

export const testRouter = router({
  // A procedure that does nothing, but is used to test that the base procedure auth checks are running.
  test: baseProcedure.query(async () => {
    return;
  }),
});

export type AppRouter = typeof testRouter;
