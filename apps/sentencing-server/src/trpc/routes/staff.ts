import { PrismaClientKnownRequestError } from "@prisma/client/runtime/library";
import { TRPCError } from "@trpc/server";
import _ from "lodash";
import { z } from "zod";

import { router, sentryProcedure } from "~sentencing-server/trpc/init";

const getStaffInputSchema = z.object({
  pseudonymizedId: z.string(),
});

const updateStaffSchema = z.object({
  pseudonymizedId: z.string(),
  hasLoggedIn: z.boolean(),
});

export const staffRouter = router({
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
        Cases: staff.Cases.map((c: (typeof staff.Cases)[number]) =>
          _.omit(c, ["externalId", "staffId", "clientId"]),
        ),
      };
    }),
  updateStaff: sentryProcedure
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
