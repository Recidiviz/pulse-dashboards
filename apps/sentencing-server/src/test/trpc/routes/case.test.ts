import { TRPCError } from "@trpc/server";
import _ from "lodash";
import { describe, expect, test } from "vitest";

import { testTRPCClient } from "~sentencing-server/test/setup";
import { fakeCase } from "~sentencing-server/test/setup/seed";

describe("case router", () => {
  describe("getCase", () => {
    test("should return case if case exists", async () => {
      const returnedCase = await testTRPCClient.case.getCase.query({
        id: fakeCase.id,
      });

      expect(returnedCase).toEqual(_.omit(fakeCase, "externalId"));
    });

    test("should throw error if case does not exist", async () => {
      await expect(() =>
        testTRPCClient.case.getCase.query({
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
