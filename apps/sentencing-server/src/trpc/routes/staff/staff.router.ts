import { PrismaClientKnownRequestError } from "@prisma/client/runtime/library";
import { TRPCError } from "@trpc/server";
import _ from "lodash";

import { baseProcedure, router } from "~sentencing-server/trpc/init";
import { REPORT_TYPE_ENUM_TO_STRING } from "~sentencing-server/trpc/routes/common/constants";
import {
  getStaffInputSchema,
  updateStaffSchema,
} from "~sentencing-server/trpc/routes/staff/staff.schema";

export const staffRouter = router({
  getStaff: baseProcedure
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
              offenseId: true,
            },
            include: {
              Client: {
                omit: {
                  externalId: true,
                },
              },
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
          },
        },
      });

      if (!staff) {
        throw new TRPCError({
          code: "NOT_FOUND",
          message: "Staff with that id was not found",
        });
      }

      return {
        ...staff,
        Cases: staff.Cases.map((c: (typeof staff.Cases)[number]) => {
          // Move offense name to top level
          const renamedOffenseCase = {
            ...c,
            reportType: REPORT_TYPE_ENUM_TO_STRING[c.reportType],
            offense: c.offense?.name,
          };

          // TODO: figure out why prisma omit typechecking is not working (this doesn't actually do anything but fix the return type)
          return _.omit(renamedOffenseCase, [
            "externalId",
            "staffId",
            "clientId",
            "offenseId",
          ]);
        }),
      };
    }),
  updateStaff: baseProcedure
    .input(updateStaffSchema)
    .mutation(
      async ({ input: { pseudonymizedId, hasLoggedIn }, ctx: { prisma } }) => {
        try {
          await prisma.staff.update({
            where: {
              pseudonymizedId,
            },
            data: {
              hasLoggedIn,
            },
          });
        } catch (e) {
          if (
            e instanceof PrismaClientKnownRequestError &&
            e.code === "P2025"
          ) {
            throw new TRPCError({
              code: "NOT_FOUND",
              message: "Staff with that id was not found",
            });
          }
        }
      },
    ),
});
