import { TRPCError } from "@trpc/server";
import _ from "lodash";
import { describe, expect, test } from "vitest";

import { prismaClient } from "~sentencing-server/prisma";
import { testTRPCClient } from "~sentencing-server/test/setup";
import {
  fakeCase,
  fakeClient,
  fakeStaff,
} from "~sentencing-server/test/setup/seed";

describe("staff router", () => {
  describe("getStaff", () => {
    test("should return staff if staff exists", async () => {
      const returnedStaff = await testTRPCClient.staff.getStaff.query({
        pseudonymizedId: fakeStaff.pseudonymizedId,
      });

      expect(returnedStaff).toEqual({
        ..._.omit(fakeStaff, "externalId"),
        Cases: [
          {
            ..._.omit(
              { ...fakeCase, recommendedOpportunities: [] },
              "externalId",
            ),
            Client: { ..._.omit(fakeClient, "externalId") },
          },
        ],
      });
    });

    test("should throw error if staff does not exist", async () => {
      await expect(() =>
        testTRPCClient.staff.getStaff.query({
          pseudonymizedId: "not-a-staff-id",
        }),
      ).rejects.toThrowError(
        new TRPCError({
          code: "NOT_FOUND",
          message: "Staff with that id was not found",
        }),
      );
    });
  });

  describe("updateStaff", () => {
    test("should update isFirstLogin", async () => {
      await testTRPCClient.staff.updateStaff.mutate({
        pseudonymizedId: fakeStaff.pseudonymizedId,
        hasLoggedIn: true,
      });

      const dbStaff = await prismaClient.staff.findUnique({
        where: { pseudonymizedId: fakeStaff.pseudonymizedId },
      });

      expect(dbStaff?.hasLoggedIn).toBeTruthy();
    });

    test("should throw error if staff does not exist", async () => {
      await expect(() =>
        testTRPCClient.staff.updateStaff.mutate({
          pseudonymizedId: "not-a-staff-id",
          hasLoggedIn: true,
        }),
      ).rejects.toThrowError(
        new TRPCError({
          code: "NOT_FOUND",
          message: "Staff with that id was not found",
        }),
      );
    });
  });
});
