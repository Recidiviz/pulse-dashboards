import { z } from "zod";

import { router, sentryProcedure } from "~sentencing-server/trpc/init";

const getCaseInputSchema = z.object({
  externalId: z.string(),
});

export const appRouter = router({
  getCase: sentryProcedure
    .input(getCaseInputSchema)
    .query(({ input: { externalId }, ctx: { prisma } }) => {
      return prisma.case.findUnique({
        where: {
          externalId,
        },
        omit: {
          id: true,
        },
        include: {
          Client: {
            omit: {
              id: true,
            },
          },
        },
      });
    }),
});

// export type definition of API
export type AppRouter = typeof appRouter;
