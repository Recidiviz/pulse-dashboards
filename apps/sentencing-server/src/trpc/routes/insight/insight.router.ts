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

import { captureException } from "@sentry/node";

import { baseProcedure, router } from "~sentencing-server/trpc/init";
import { getInsights } from "~sentencing-server/trpc/routes/common/utils";
import { getInsightSchema } from "~sentencing-server/trpc/routes/insight/insight.schema";

export const insightRouter = router({
  getInsight: baseProcedure
    .input(getInsightSchema)
    .query(
      async ({
        input: {
          offenseName,
          gender,
          lsirScore,
          isSexOffense,
          isViolentOffense,
        },
        ctx: { prisma },
      }) => {
        const insights = await getInsights(
          offenseName,
          gender,
          lsirScore,
          isSexOffense,
          isViolentOffense,
          prisma,
        );

        if (!insights.length) {
          return null;
        }

        if (insights.length > 1) {
          captureException(
            `Multiple insights found for attributes offense name of ${offenseName}, gender of ${gender}, and LSI-R Score of ${lsirScore}: ${JSON.stringify(insights)}. Returning the first one.`,
          );
        }

        return insights[0];
      },
    ),
});
