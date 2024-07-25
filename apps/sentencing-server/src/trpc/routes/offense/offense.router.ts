import { baseProcedure, router } from "~sentencing-server/trpc/init";

export const offenseRouter = router({
  getOffenses: baseProcedure.query(async ({ ctx: { prisma } }) => {
    const offenses = await prisma.offense.findMany({
      select: {
        name: true,
      },
    });

    return offenses.map((offense) => offense.name);
  }),
});
