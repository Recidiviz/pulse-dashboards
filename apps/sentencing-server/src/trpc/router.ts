import { TRPCError } from "@trpc/server";
import _ from "lodash";
import { z } from "zod";

import { router, sentryProcedure } from "~sentencing-server/trpc/init";

const getStaffInputSchema = z.object({
  pseudonymizedId: z.string(),
});

const getCaseInputSchema = z.object({
  id: z.string(),
});

export const appRouter = router({
  getStaff: sentryProcedure
    .input(getStaffInputSchema)
    .query(async ({ input: { pseudonymizedId }, ctx: { prisma } }) => {
      const staff = await prisma.staff.findUnique({
        where: {
          pseudonymizedId,
        },
        omit: {
          externalId: true,
        },
        include: {
          Cases: {
            omit: {
              externalId: true,
              staffId: true,
              clientId: true,
            },
            include: {
              Client: {
                omit: {
                  externalId: true,
                },
              },
            },
          },
        },
      });

      if (!staff) {
        throw new TRPCError({
          code: "NOT_FOUND",
          message: "Staff with that id was not found",
        });
      }

      // TODO: figure out why prisma omit typechecking is not working (this doesn't actually do anything but fix the return type)
      return {
        ...staff,
        Cases: staff.Cases.map(
          (c: {
            externalId: string;
            staffId: string | null;
            clientId: string | null;
          }) => _.omit(c, ["externalId", "staffId", "clientId"]),
        ),
      };
    }),
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

// export type definition of API
export type AppRouter = typeof appRouter;
