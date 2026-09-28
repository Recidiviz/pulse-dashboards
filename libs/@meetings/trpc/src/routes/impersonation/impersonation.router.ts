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

import { TRPCError } from "@trpc/server";
import { z } from "zod";

import { fetchImpersonatedUser } from "~@meetings/trpc/impersonation";
import { baseProcedure, router } from "~@meetings/trpc/init";

export const impersonationRouter = router({
  lookupUser: baseProcedure // Base Procedure because we won't have a state code
    .input(z.object({ email: z.string().email() }))
    .query(async ({ ctx, input }) => {
      // Trust only the context's dev-mode-verified flag, never the raw header.
      const shouldSkipAuth = ctx.isSkipAuth;
      if (!ctx.user?.isRecidivizUser && !shouldSkipAuth) {
        throw new TRPCError({ code: "FORBIDDEN" });
      }
      const { stateCode } = await fetchImpersonatedUser(input.email);

      if (!shouldSkipAuth && !ctx.user?.allowedStates?.includes(stateCode)) {
        // Don't echo the target's stateCode; callers may lack access to it.
        throw new TRPCError({
          code: "FORBIDDEN",
          message:
            "You do not have access to this user's state. File a go/access request for access.",
        });
      }

      return { stateCode };
    }),
});
