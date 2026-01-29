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

import { TRPCFastifyRequest } from "../context";
import { baseProcedure } from "./init";
import { checkStatePermissions } from "./utils/checkStatePermissions";
import { getDatabaseConnection } from "./utils/getDatabaseConnection";
import { processFirebaseAuthPayload } from "./utils/processFirebaseAuthPayload";
import { validateCRUDHeaders } from "./utils/validateCRUDHeaders";

// this could eventually be shared with other libraries but defined here for convenience
const authorizedStaffAppUserProfileSchema = z.object({
  app: z.literal("staff"),
  stateCode: z.string(),
  recidivizAllowedStates: z.array(z.string()),
  impersonator: z.boolean(),
});
type AuthorizedStaffAppUserProfile = z.infer<
  typeof authorizedStaffAppUserProfileSchema
>;

function checkCommonReadWritePermissions(
  stateCode: string,
  isDemoRequest: boolean,
  userProfile: AuthorizedStaffAppUserProfile,
) {
  checkStatePermissions(
    stateCode,
    isDemoRequest,
    userProfile.stateCode,
    userProfile.recidivizAllowedStates,
  );
}

function checkWriteOnlyPermissions(
  stateCode: string,
  userProfile: AuthorizedStaffAppUserProfile,
) {
  if (userProfile.impersonator) {
    throw new TRPCError({
      code: "FORBIDDEN",
      message: "Data mutations are not allowed during impersonation",
    });
  }
  // additional restrictions in prod
  if (process.env["DEPLOY_ENV"] === "production") {
    // internal users (as identified by their state code) should not be able to write to prod
    if (stateCode !== userProfile.stateCode) {
      throw new TRPCError({
        code: "FORBIDDEN",
        message:
          "Data mutations are not allowed by internal users in production",
      });
    }
  }
}

/**
 * This function both validates the auth token and checks its claims
 * to make an auth determination for the current request
 */
async function validateAuthPayload(
  stateCode: string,
  isDemoRequest: boolean,
  procedureType: "query" | "mutation" | "subscription",
  req: TRPCFastifyRequest,
) {
  const { userId, userProfile } = await processFirebaseAuthPayload(
    req,
    authorizedStaffAppUserProfileSchema,
  );

  checkCommonReadWritePermissions(stateCode, isDemoRequest, userProfile);

  if (procedureType === "mutation") {
    checkWriteOnlyPermissions(stateCode, userProfile);
  }

  return { userId, userProfile };
}

export const firebaseAuthedStaffProcedure = baseProcedure.use(
  async ({ ctx: { req }, type, next }) => {
    const { stateCode, isDemoRequest } = validateCRUDHeaders(req);
    const { userId, userProfile } = await validateAuthPayload(
      stateCode,
      isDemoRequest,
      type,
      req,
    );
    const prisma = getDatabaseConnection(stateCode, isDemoRequest);

    return next({ ctx: { userId, userProfile, prisma } });
  },
);
