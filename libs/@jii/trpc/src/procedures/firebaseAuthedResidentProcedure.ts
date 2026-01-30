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

import { AuthorizedUserProfile, authorizedUserProfileSchema } from "~@jii/auth";
import { PrismaClient } from "~@jii/prisma";

import type { TRPCFastifyRequest } from "../context";
import { baseProcedure } from "./init";
import { checkStatePermissions } from "./utils/checkStatePermissions";
import { getDatabaseConnection } from "./utils/getDatabaseConnection";
import { processFirebaseAuthPayload } from "./utils/processFirebaseAuthPayload";
import { validateCRUDHeaders } from "./utils/validateCRUDHeaders";

async function validateAuthPayload(
  stateCode: string,
  isDemoRequest: boolean,
  req: TRPCFastifyRequest,
) {
  const { userId, userProfile } = await processFirebaseAuthPayload(
    req,
    authorizedUserProfileSchema,
  );

  checkStatePermissions(
    stateCode,
    isDemoRequest,
    userProfile.stateCode,
    userProfile.allowedStates ?? [],
  );

  return { userId, userProfile };
}

function getDatabaseConnectionForPermissions(
  stateCode: string,
  isDemoRequest: boolean,
  permissions: AuthorizedUserProfile["permissions"],
) {
  // clients can explicitly request demo data,
  // or we may limit them to demo data only based on their permissions
  const useDemoDb = isDemoRequest || !permissions?.includes("live_data");

  return getDatabaseConnection(stateCode, useDemoDb);
}

export type AuthorizedResidentUserContext = {
  userId: string;
  userProfile: AuthorizedUserProfile;
  stateCode: string;
  prisma: PrismaClient;
};

export const firebaseAuthedResidentProcedure = baseProcedure.use(
  async ({ ctx: { req }, next }) => {
    const { stateCode, isDemoRequest } = validateCRUDHeaders(req);

    const { userId, userProfile } = await validateAuthPayload(
      stateCode,
      isDemoRequest,
      req,
    );

    const prisma = getDatabaseConnectionForPermissions(
      stateCode,
      isDemoRequest,
      userProfile.permissions,
    );

    return next<AuthorizedResidentUserContext>({
      ctx: {
        userId,
        userProfile,
        stateCode,
        prisma,
      },
    });
  },
);
