import { PrismaClientKnownRequestError } from "@prisma/client/runtime/library";
import { captureException } from "@sentry/node";
import { TRPCError } from "@trpc/server";

import { OPPORTUNITY_UNKNOWN_PROVIDER_NAME } from "~sentencing-server/common/constants";
import { baseProcedure, router } from "~sentencing-server/trpc/init";
import {
  getCaseInputSchema,
  updateCaseSchema,
} from "~sentencing-server/trpc/routes/case/case.schema";
import { PRISMA_CASE_GET_ARGS } from "~sentencing-server/trpc/routes/case/constants";
import { getInsightForCase } from "~sentencing-server/trpc/routes/case/utils";

export const caseRouter = router({
  getCase: baseProcedure
    .input(getCaseInputSchema)
    .query(async ({ input: { id }, ctx: { prisma } }) => {
      const caseData = await prisma.case.findUnique({
        where: {
          id,
        },
        ...PRISMA_CASE_GET_ARGS,
      });

      if (!caseData) {
        throw new TRPCError({
          code: "NOT_FOUND",
          message: "Case with that id was not found",
        });
      }

      let insight = undefined;
      try {
        insight = await getInsightForCase(caseData, prisma);
      } catch (e) {
        // Log any errors but still return the case data
        captureException(e);
      }

      // move offense to top level and include insight
      return {
        ...caseData,
        reportType: caseData.reportType,
        recommendedOpportunities: caseData.recommendedOpportunities.map(
          (opportunity) => ({
            ...opportunity,
            providerName:
              // Map these names back to null for the client
              opportunity.providerName === OPPORTUNITY_UNKNOWN_PROVIDER_NAME
                ? null
                : opportunity.providerName,
          }),
        ),
        offense: caseData.offense?.name,
        insight,
      };
    }),
  updateCase: baseProcedure
    .input(updateCaseSchema)
    .mutation(async ({ input: { id, attributes }, ctx: { prisma } }) => {
      try {
        if (attributes.lsirScore) {
          const { isLsirScoreLocked } = await prisma.case.findUniqueOrThrow({
            where: {
              id,
            },
            select: {
              isLsirScoreLocked: true,
            },
          });

          if (isLsirScoreLocked) {
            throw new TRPCError({
              code: "BAD_REQUEST",
              message: "LSIR score is locked and cannot be updated",
            });
          }
        }
      } catch (e) {
        if (e instanceof PrismaClientKnownRequestError && e.code === "P2025") {
          throw new TRPCError({
            code: "NOT_FOUND",
            message: "Case with that id was not found",
          });
        }

        throw e;
      }

      try {
        await prisma.case.update({
          where: {
            id,
          },
          data: {
            ...attributes,
            recommendedOpportunities: {
              set: attributes.recommendedOpportunities?.map((opportunity) => ({
                opportunityName_providerName: opportunity,
              })),
            },
            offense: {
              connect: attributes.offense
                ? {
                    name: attributes.offense,
                  }
                : undefined,
            },
          },
        });
      } catch (e) {
        if (e instanceof PrismaClientKnownRequestError && e.code === "P2025") {
          throw new TRPCError({
            code: "NOT_FOUND",
            message: "Case with that id was not found",
          });
        }
      }
    }),
});
