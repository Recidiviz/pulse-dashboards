import { PrismaClientKnownRequestError } from "@prisma/client/runtime/library";
import { TRPCError } from "@trpc/server";
import _ from "lodash";

import { baseProcedure, router } from "~sentencing-server/trpc/init";
import {
  getCaseInputSchema,
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
});
