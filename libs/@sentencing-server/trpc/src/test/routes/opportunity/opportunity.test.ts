// Recidiviz - a data platform for criminal justice reform
// Copyright (C) 2024 Recidiviz, Inc.
//
// This program is free software: you can redistribute it and/or modify
// it under the terms of the GNU General Public License as published by
// the Free Software Foundation, either version 3 of the License, or
// (at your option) any later version.
//
// This program is distributed in the hope that it will be useful,
// but WITHOUT ANY WARRANTY; without even the implied warranty of
// MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.  See the
// GNU General Public License for more details.
//
// You should have received a copy of the GNU General Public License
// along with this program.  If not, see <https://www.gnu.org/licenses/>.
// =============================================================================

import { describe, expect, test } from "vitest";

import { OPPORTUNITY_UNKNOWN_PROVIDER_NAME } from "~@sentencing-server/prisma";
import {
  testPrismaClient,
  testTRPCClient,
} from "~@sentencing-server/trpc/test/setup";
import { fakeOpportunity } from "~@sentencing-server/trpc/test/setup/seed";

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
      await testPrismaClient.opportunity.create({
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
