import { PrismaClientKnownRequestError } from "@prisma/client/runtime/library";
import { TRPCError } from "@trpc/server";

import { baseProcedure, router } from "~sentencing-server/trpc/init";
import {
  getCaseInputSchema,
  getInsightForCaseSchema,
  updateCaseSchema,
} from "~sentencing-server/trpc/routes/case/case.schema";
import { REPORT_TYPE_ENUM_TO_STRING } from "~sentencing-server/trpc/routes/common/constants";

export const caseRouter = router({
  getCase: baseProcedure
    .input(getCaseInputSchema)
    .query(async ({ input: { id }, ctx: { prisma } }) => {
      const caseData = await prisma.case.findUnique({
        where: {
          id,
        },
        omit: {
          staffId: true,
          clientId: true,
          offenseId: true,
        },
        include: {
          recommendedOpportunities: {
            select: {
              opportunityName: true,
              providerPhoneNumber: true,
            },
          },
          offense: {
            select: {
              name: true,
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

      return {
        ...caseData,
        reportType: REPORT_TYPE_ENUM_TO_STRING[caseData.reportType],
        offense: caseData.offense?.name,
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
              connect: attributes.recommendedOpportunities?.map(
                (opportunity) => ({
                  opportunityName_providerPhoneNumber: opportunity,
                }),
              ),
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
  getInsightForCase: baseProcedure
    .input(getInsightForCaseSchema)
    .query(async ({ input: { id }, ctx: { prisma } }) => {
      const caseData = await prisma.case.findUnique({
        where: {
          id,
        },
        select: {
          lsirScore: true,
          offense: true,
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

      if (!caseData.offense) {
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
          offenseId: caseData.offense.id,
          gender: caseData.Client.gender,
        },
        include: {
          Offense: {
            select: {
              name: true,
            },
          },
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
          offenseId: true,
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

      const insightToReturn = insights[0];

      return {
        ...insightToReturn,
        // Move offense name to top level
        offense: insightToReturn.Offense.name,
      };
    }),
});
