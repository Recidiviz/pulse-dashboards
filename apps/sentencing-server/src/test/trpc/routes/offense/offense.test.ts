import { describe, expect, test } from "vitest";

import { testTRPCClient } from "~sentencing-server/test/setup";
import { fakeOffense } from "~sentencing-server/test/setup/seed";

describe("offense router", () => {
  describe("getOffenses", () => {
    test("should return all offenses", async () => {
      const returnedOffenses = await testTRPCClient.offense.getOffenses.query();

      expect(returnedOffenses).toEqual(
        expect.arrayContaining([fakeOffense.name]),
      );
    });
  });
});
