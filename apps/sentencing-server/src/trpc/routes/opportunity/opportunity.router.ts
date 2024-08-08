import { OPPORTUNITY_UNKNOWN_PROVIDER_NAME } from "~sentencing-server/common/constants";
import { baseProcedure, router } from "~sentencing-server/trpc/init";

export const opportunityRouter = router({
  getOpportunities: baseProcedure.query(async ({ ctx: { prisma } }) => {
    const opportunities = await prisma.opportunity.findMany({
      omit: {
        id: true,
      },
    });

    return opportunities.map((opportunity) => ({
      ...opportunity,
      providerName:
        // If the provider name is the default unknown provider name, return null
        opportunity.providerName === OPPORTUNITY_UNKNOWN_PROVIDER_NAME
          ? null
          : opportunity.providerName,
    }));
  }),
});
