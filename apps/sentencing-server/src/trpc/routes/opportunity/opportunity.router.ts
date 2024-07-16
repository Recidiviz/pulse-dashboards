import { baseProcedure, router } from "~sentencing-server/trpc/init";

export const opportunityRouter = router({
  getOpportunities: baseProcedure.query(async ({ ctx: { prisma } }) => {
    return await prisma.opportunity.findMany({
      omit: {
        id: true,
      },
    });
  }),
});
