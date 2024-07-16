import { describe, expect, test } from "vitest";

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
  });
});
