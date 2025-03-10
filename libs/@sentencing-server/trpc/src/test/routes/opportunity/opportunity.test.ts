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

import { NeedToBeAddressed } from "@prisma/sentencing-server/client";
import { http, HttpResponse } from "msw";
import { describe, expect, test } from "vitest";

import { OPPORTUNITY_UNKNOWN_PROVIDER_NAME } from "~@sentencing-server/prisma";
import { testAndGetSentryReports } from "~@sentencing-server/trpc/test/common/utils";
import {
  testPrismaClient,
  testTRPCClient,
} from "~@sentencing-server/trpc/test/setup";
import { mswServer } from "~@sentencing-server/trpc/test/setup/msw";
import {
  fakeOpportunity,
  fakeOpportunity2,
} from "~@sentencing-server/trpc/test/setup/seed";

describe("opportunity router", () => {
  describe("getOpportunities", () => {
    test("should return all opportunities", async () => {
      const returnedOpportunities =
        await testTRPCClient.opportunity.getOpportunities.query({});

      expect(returnedOpportunities).toEqual(
        expect.arrayContaining([
          expect.objectContaining({
            ...fakeOpportunity,
          }),
          expect.objectContaining({
            ...fakeOpportunity2,
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
        await testTRPCClient.opportunity.getOpportunities.query({});

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

    describe("find help", () => {
      test("should not include findhelp programs by default", async () => {
        const returnedOpportunities =
          await testTRPCClient.opportunity.getOpportunities.query({});

        expect(returnedOpportunities).toEqual([
          expect.objectContaining({
            ...fakeOpportunity,
          }),
          expect.objectContaining({
            ...fakeOpportunity2,
          }),
        ]);
      });

      test("should report authentication error but still return internal opportunities", async () => {
        // Override the authentication endpoint to return a failure
        mswServer.use(
          http.post("https://api.auntberthaqa.com/v3/authenticate", () => {
            return HttpResponse.json({
              success: false,
            });
          }),
        );

        const returnedOpportunities =
          await testTRPCClient.opportunity.getOpportunities.query({
            includeFindHelpPrograms: true,
          });

        expect(returnedOpportunities).toEqual(
          expect.arrayContaining([
            expect.objectContaining({
              ...fakeOpportunity,
            }),
            expect.objectContaining({
              ...fakeOpportunity2,
            }),
          ]),
        );

        const sentryReports = await testAndGetSentryReports();
        expect(sentryReports[0].error?.message).toContain(
          "Failed to authenticate with Findhelp",
        );
      });

      test("should return formatted programs and internal opportunities", async () => {
        const returnedOpportunities =
          await testTRPCClient.opportunity.getOpportunities.query({
            includeFindHelpPrograms: true,
          });

        expect(returnedOpportunities).toEqual(
          expect.arrayContaining([
            expect.objectContaining({
              ...fakeOpportunity,
            }),
            expect.objectContaining({
              ...fakeOpportunity2,
            }),
            expect.objectContaining({
              providerName: "fake_provider",
              providerPhoneNumber: "fake_phone",
              providerWebsite: "fake_url",
              providerAddress: "fake_address1",
              needsAddressed: expect.arrayContaining([
                NeedToBeAddressed.Healthcare,
                NeedToBeAddressed.SubstanceUse,
              ]),
            }),
          ]),
        );
      });
    });
  });
});
