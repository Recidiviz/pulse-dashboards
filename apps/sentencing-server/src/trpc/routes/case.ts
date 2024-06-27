import { TRPCError } from "@trpc/server";
import { z } from "zod";

import { router, sentryProcedure } from "~sentencing-server/trpc/init";

const getCaseInputSchema = z.object({
  id: z.string(),
});

export const caseRouter = router({
  getCase: sentryProcedure
    .input(getCaseInputSchema)
    .query(async ({ input: { id }, ctx: { prisma } }) => {
      const caseData = await prisma.case.findUnique({
        where: {
          id,
        },
        omit: {
          externalId: true,
          staffId: true,
          clientId: true,
        },
      });

      if (!caseData) {
        throw new TRPCError({
          code: "NOT_FOUND",
          message: "Case with that id was not found",
        });
      }

      return caseData;
    }),
});
