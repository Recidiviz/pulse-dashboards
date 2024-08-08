import { describe, expect, test } from "vitest";

import { OPPORTUNITY_UNKNOWN_PROVIDER_NAME } from "~sentencing-server/common/constants";
import { prismaClient } from "~sentencing-server/prisma";
import { testTRPCClient } from "~sentencing-server/test/setup";
import { fakeOpportunity } from "~sentencing-server/test/setup/seed";

describe("opportunity router", () => {
  describe("getOpportunities", () => {
    test("should return all opportunities", async () => {
      const returnedOpportunities =
        await testTRPCClient.opportunity.getOpportunities.query();

      expect(returnedOpportunities).toEqual(
        expect.arrayContaining([
          expect.objectContaining({
            ...fakeOpportunity,
          }),
        ]),
      );
    });

    test("should return empty provider name if it is set to unknown", async () => {
      // Create an opportunity with the default provider name
      await prismaClient.opportunity.create({
        data: {
          ...fakeOpportunity,
          providerName: OPPORTUNITY_UNKNOWN_PROVIDER_NAME,
        },
      });

      const returnedOpportunities =
        await testTRPCClient.opportunity.getOpportunities.query();

      expect(returnedOpportunities).toEqual(
        expect.arrayContaining([
          expect.objectContaining({
            ...fakeOpportunity,
          }),
          expect.objectContaining({
            ...fakeOpportunity,
            providerName: null,
          }),
        ]),
      );
    });
  });
});
