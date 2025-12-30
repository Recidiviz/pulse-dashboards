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
import superjson from "superjson";

import { createContext } from "~@meetings/trpc/context";
import { procedurePlugin } from "~server-setup-plugin";

export const t = initTRPC
  .context<typeof createContext>()
  // Required to get Date objects to serialize correctly.
  .create({ transformer: superjson });

export const router = t.router;

const plugin = procedurePlugin();

export const baseProcedure = t.procedure.concat(plugin);

export const auth0Procedure = baseProcedure.use(async (opts) => {
  const { ctx } = opts;
  if (!ctx.isAuth0Authorized || !ctx.user) {
    throw new TRPCError({ code: "UNAUTHORIZED" });
  }

  // We should never realistically hit this conditional because if there's no state code we set
  // isAuth0Authorized to false, but this gives us a guarantee for types.
  if (!ctx.stateCode || !ctx.prisma) {
    throw new TRPCError({
      code: "PRECONDITION_FAILED",
      message: "State code is required for authenticated requests",
    });
  }

  return opts.next({
    ctx: {
      user: ctx.user,
      isAuth0Authorized: ctx.isAuth0Authorized,
      stateCode: ctx.stateCode,
      prisma: ctx.prisma,
    },
  });
});
