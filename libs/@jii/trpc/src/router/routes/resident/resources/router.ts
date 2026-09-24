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

import { z } from "zod";

import { segment } from "../../../../analytics/segment";
import { firebaseAuthedResidentProcedure } from "../../../../procedures/firebaseAuthedResidentProcedure";
import { router } from "../../../../procedures/init";
import { resourceApiClient } from "./resourceApiClient";

export const resourcesRouter = router({
  getResources: firebaseAuthedResidentProcedure.query(({ ctx }) =>
    resourceApiClient.getOrganizations(ctx.stateCode),
  ),

  getResource: firebaseAuthedResidentProcedure
    .input(z.object({ organizationId: z.number() }))
    .query(({ input }) =>
      resourceApiClient.getOrganization(input.organizationId),
    ),

  logSearchQueryAnonymously: firebaseAuthedResidentProcedure
    .input(
      z.object({
        query: z.string().transform((q) => q.slice(0, 500)),
        resultCount: z.number().int().nonnegative(),
        searchSessionId: z.string().uuid(),
      }),
    )
    .mutation(({ ctx, input }) => {
      const isRecidivizUser = ctx.userProfile.stateCode === "RECIDIVIZ";

      segment.trackAnonymousEvent(
        "backend_cre_search_query",
        input.searchSessionId,
        {
          query: input.query,
          resultCount: input.resultCount,
          stateCode: ctx.stateCode,
        },
        { isRecidivizUser },
      );
      return { success: true };
    }),
});
