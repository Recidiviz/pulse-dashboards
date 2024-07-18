import { PrismaClientKnownRequestError } from "@prisma/client/runtime/library";
import { TRPCError } from "@trpc/server";
import _ from "lodash";

import { baseProcedure, router } from "~sentencing-server/trpc/init";
import {
  getCaseInputSchema,
  getInsightForCaseSchema,
  updateCaseSchema,
} from "~sentencing-server/trpc/routes/case/case.schema";

export const caseRouter = router({
  getCase: baseProcedure
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
        include: {
          recommendedOpportunities: {
            select: {
              opportunityName: true,
              providerPhoneNumber: true,
            },
          },
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
            ..._.omit(attributes, ["recommendedOpportunities"]),
            recommendedOpportunities: {
              connect: attributes.recommendedOpportunities?.map(
                (opportunity) => ({
                  opportunityName_providerPhoneNumber: opportunity,
                }),
              ),
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
  getInsightForCase: baseProcedure
    .input(getInsightForCaseSchema)
    .query(async ({ input: { id }, ctx: { prisma } }) => {
      const caseData = await prisma.case.findUnique({
        where: {
          id,
        },
        select: {
          lsirScore: true,
          primaryCharge: true,
          Client: {
            select: {
              gender: true,
            },
          },
        },
      });

      if (!caseData || !caseData.Client) {
        throw new TRPCError({
          code: "NOT_FOUND",
          message: "Case with that id was not found",
        });
      }

      if (!caseData.lsirScore) {
        throw new TRPCError({
          code: "NOT_FOUND",
          message:
            "Case with that id is missing an lsir score. Cannot retrieve an insight without an lsir score.",
        });
      }

      if (!caseData.primaryCharge) {
        throw new TRPCError({
          code: "NOT_FOUND",
          message:
            "Case with that id is missing an offense. Cannot retrieve an insight without an offense.",
        });
      }

      const insights = await prisma.insight.findMany({
        where: {
          assessmentScoreBucketStart: {
            lte: caseData.lsirScore,
          },
          assessmentScoreBucketEnd: {
            gte: caseData.lsirScore,
          },
          offense: caseData.primaryCharge,
          gender: caseData.Client.gender,
        },
        include: {
          recidivismSeries: {
            select: {
              recommendationType: true,
              dataPoints: {
                omit: {
                  id: true,
                  recidivismSeriesId: true,
                },
              },
            },
          },
          dispositionData: {
            omit: {
              id: true,
              insightId: true,
            },
          },
        },
        omit: {
          id: true,
        },
      });

      if (!insights.length) {
        throw new TRPCError({
          code: "NOT_FOUND",
          message: "No corresponding insight found for provided case.",
        });
      }

      if (insights.length > 1) {
        console.warn(
          `Multiple insights found for case ${id}: ${JSON.stringify(insights)}. Returning first one.`,
        );
      }

      return insights[0];
    }),
});
