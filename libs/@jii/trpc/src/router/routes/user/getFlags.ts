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
import { UserFlagId } from "~@jii/prisma";
import { typedFromEntries } from "~utils";

import { firebaseAuthedResidentProcedure } from "../../../procedures/firebaseAuthedResidentProcedure";

export const getFlags = firebaseAuthedResidentProcedure.query(
  async ({ ctx }) => {
    if (ctx.userProfile.permissions?.includes("all_user_flags_enabled")) {
      return typedFromEntries(
        Object.values(UserFlagId).map((id) => [id, true]),
      );
    }

    const rows = await ctx.prisma.userFlagInstance.findMany({
      where: {
        userId: ctx.userId,
        effectiveAt: { lte: new Date() },
      },
      select: { flagId: true },
    });
    const personalFlags = typedFromEntries(rows.map((r) => [r.flagId, true]));

    const now = new Date();
    const flagsConfig =
      residentsConfigByState[ctx.stateCode as StateCode]?.enabledUserFlags ??
      {};
    const statewideFlags = typedFromEntries(
      Object.entries(flagsConfig)
        .filter(([, date]) => date <= now)
        .map(([id]) => [id as UserFlagId, true]),
    );

    return {
      ...personalFlags,
      ...statewideFlags,
    };
  },
);
