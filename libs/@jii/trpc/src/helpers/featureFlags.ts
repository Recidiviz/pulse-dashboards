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

import { residentsConfigByState, StateCode } from "~@jii/configs";
import { PrismaClient, UserFlagId } from "~@jii/prisma";

type UserFlagOpts = {
  flagId: UserFlagId;
  userId: string;
  stateCode: StateCode;
  prisma: PrismaClient;
};

export async function isUserFlagActive({
  flagId,
  userId,
  stateCode,
  prisma,
}: UserFlagOpts): Promise<boolean> {
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
        userId,
        flagId,
        effectiveAt: {
          lte: now,
        },
      },
    })) > 0
  );
}
