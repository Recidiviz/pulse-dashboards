import { PrismaClientKnownRequestError } from "@prisma/client/runtime/library";
import { TRPCError } from "@trpc/server";

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
            select: {
              id: true,
              externalId: true,
              dueDate: true,
              reportType: true,
              status: true,
              Client: {
                select: {
                  fullName: true,
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
        Cases: staff.Cases.map((c: (typeof staff.Cases)[number]) => ({
          ...c,
          reportType: REPORT_TYPE_ENUM_TO_STRING[c.reportType],
          offense: c.offense?.name,
        })),
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
