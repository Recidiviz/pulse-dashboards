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

import { Permission } from "~@jii/auth";
import { residentsConfigByState, StateCode } from "~@jii/configs";
import { PrismaClient, UserFlagId } from "~@jii/prisma";

type UserFlagOpts = {
  flagId: UserFlagId;
  userIdFromAuthProvider: string;
  stateCode: StateCode;
  prisma: PrismaClient;
  userPermissions: Array<Permission> | undefined;
};

/**
 * Checks flag status for the specified user.
 * Note that user flags are keyed by the ID supplied by their auth provider,
 * which is NOT THE SAME as their external ID (e.g. DOC ID); it requires the `userId`
 * supplied by an authed prodecure's context.
 */
export async function isUserFlagActive({
  flagId,
  userIdFromAuthProvider,
  stateCode,
  prisma,
  userPermissions,
}: UserFlagOpts): Promise<boolean> {
  // user permissions are optional because we may be calling this before we know what
  // the user's permissions are. That is safe to do (the flag checks themselves are always allowed)
  // and should only affect internal users anyway if something does get out of sync
  if (userPermissions?.includes("all_user_flags_enabled")) return true;

  const now = new Date();
  // check statewide flag first since it takes precedence and doesn't hit the DB
  const statewideFlag =
    residentsConfigByState[stateCode].enabledUserFlags?.[flagId];
  if (statewideFlag && statewideFlag <= now) {
    return true;
  }

  return (
    (await prisma.userFlagInstance.count({
      where: {
        userId: userIdFromAuthProvider,
        flagId,
        effectiveAt: {
          lte: now,
        },
      },
    })) > 0
  );
}
