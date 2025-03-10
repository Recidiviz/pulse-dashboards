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

import { OPPORTUNITY_UNKNOWN_PROVIDER_NAME } from "~@sentencing-server/prisma";
import { baseProcedure, router } from "~@sentencing-server/trpc/init";
import { getOpportunitiesInputSchema } from "~@sentencing-server/trpc/routes/opportunity/opportunity.schema";
import { PrismaOpportunity } from "~@sentencing-server/trpc/routes/opportunity/types";
import { getFindHelpPrograms } from "~@sentencing-server/trpc/routes/opportunity/utils";

export const opportunityRouter = router({
  getOpportunities: baseProcedure
    .input(getOpportunitiesInputSchema)
    .query(async ({ ctx: { prisma }, input: { includeFindHelpPrograms } }) => {
      const opportunities = await prisma.opportunity.findMany({
        omit: {
          id: true,
        },
      });

      const cleanedDbOpportunities = opportunities.map((opportunity) => ({
        ...opportunity,
        providerName:
          // If the provider name is the default unknown provider name, return null
          opportunity.providerName === OPPORTUNITY_UNKNOWN_PROVIDER_NAME
            ? null
            : opportunity.providerName,
      }));

      let findHelpOpportunities: PrismaOpportunity[] = [];
      if (includeFindHelpPrograms) {
        try {
          findHelpOpportunities = await getFindHelpPrograms();
        } catch (e) {
          captureException(e);
        }
      }

      return cleanedDbOpportunities.concat(findHelpOpportunities);
    }),
});
