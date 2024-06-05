import { TRPCError } from "@trpc/server";
import _ from "lodash";
import { describe, expect, test } from "vitest";

import { testTRPCClient } from "~sentencing-server/test/setup";
import {
  fakeCase,
  fakeClient,
  fakeStaff,
} from "~sentencing-server/test/setup/seed";

// TODO(https://github.com/Recidiviz/recidiviz-data/issues/30276): re-enable once the integration test db is set up
describe("router", () => {
  describe("getStaff", () => {
    test("should return staff if staff exists", async () => {
      const returnedStaff = await testTRPCClient.getStaff.query({
        pseudonymizedId: fakeStaff.pseudonymizedId,
      });

      expect(returnedStaff).toEqual({
        ..._.omit(fakeStaff, "externalId"),
        Cases: [
          {
            ..._.omit(fakeCase, "externalId"),
            Client: { ..._.omit(fakeClient, "externalId") },
          },
        ],
      });
    });

    test("should throw error if staff does not exist", async () => {
      await expect(() =>
        testTRPCClient.getStaff.query({
          pseudonymizedId: "not-a-real-id",
        }),
      ).rejects.toThrowError(
        new TRPCError({
          code: "NOT_FOUND",
          message: "Staff with that id was not found",
        }),
      );
    });
  });

  describe("getCase", () => {
    test("should return case if case exists", async () => {
      const returnedCase = await testTRPCClient.getCase.query({
        id: fakeCase.id,
      });

      expect(returnedCase).toEqual(_.omit(fakeCase, "externalId"));
    });

    test("should throw error if case does not exist", async () => {
      await expect(() =>
        testTRPCClient.getCase.query({
          id: "not-a-real-id",
        }),
      ).rejects.toThrowError(
        new TRPCError({
          code: "NOT_FOUND",
          message: "Case with that id was not found",
        }),
      );
    });
  });
});
