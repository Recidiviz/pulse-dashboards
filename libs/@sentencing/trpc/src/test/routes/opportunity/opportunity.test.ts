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

import { NeedToBeAddressed } from "@prisma/sentencing/client";
import { http, HttpResponse } from "msw";
import { describe, expect, test } from "vitest";

import { OPPORTUNITY_UNKNOWN_PROVIDER_NAME } from "~@sentencing/prisma";
import { Programs } from "~@sentencing/trpc/routes/opportunity/types";
import { testAndGetSentryReports } from "~@sentencing/trpc/test/common/utils";
import { testPrismaClient, testTRPCClient } from "~@sentencing/trpc/test/setup";
import { mswServer } from "~@sentencing/trpc/test/setup/msw";
import {
  fakeOpportunity,
  fakeOpportunity2,
} from "~@sentencing/trpc/test/setup/seed";

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

    describe("Findhelp", () => {
      test("should not include Findhelp programs by default", async () => {
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

      test("should throw error if unable to authenticate after three tries", async () => {
        // Auth token will have been set by the first call
        await testTRPCClient.opportunity.getOpportunities.query({
          includeFindHelpPrograms: true,
        });

        mswServer.use(
          // Override the programs response to always return a 401 auth error now (reauth never works)
          http.get(
            `https://api.auntberthaqa.com/v2/zipcodes/*/programsLite`,
            () => {
              return new HttpResponse(null, { status: 401 });
            },
          ),
        );

        // The second call should never successfully authenticate and will throw a new error
        const returnedOpportunities =
          await testTRPCClient.opportunity.getOpportunities.query({
            includeFindHelpPrograms: true,
          });

        // Should still return the internal opportunities
        expect(returnedOpportunities).toEqual([
          expect.objectContaining({
            ...fakeOpportunity,
          }),
          expect.objectContaining({
            ...fakeOpportunity2,
          }),
        ]);

        const sentryReports = await testAndGetSentryReports();
        expect(sentryReports[0].error?.message).toContain(
          "Failed to authenticate with Findhelp after three attempts",
        );
      });

      test("should attempt to reauthenticate if authentication token has expired", async () => {
        // Auth token will have been set by the first call
        await testTRPCClient.opportunity.getOpportunities.query({
          includeFindHelpPrograms: true,
        });

        mswServer.use(
          // Override the programs response to return a 401 auth error if it gets the old token
          http.get(
            `https://api.auntberthaqa.com/v2/zipcodes/*/programsLite`,
            ({ request }) => {
              const authHeader = request.headers.get("Authorization");

              if (authHeader === "Bearer fake_auth_token") {
                return new HttpResponse(null, { status: 401 });
              }

              return HttpResponse.json({
                programs: [
                  {
                    name: "fake_program",
                    description: "fake_description",
                    provider_name: "fake_provider",
                    website_url: "fake_url",
                    offices: [
                      {
                        phone_number: "fake_phone",
                        address1: "fake_address1",
                      },
                    ],
                    attribute_tags: ["fake_attribute"],
                    service_tags: ["dental care", "addiction & recovery"],
                  },
                ],
                count: 1,
              } satisfies Programs);
            },
          ),
          // Get the authentication to return a new auth token
          http.post("https://api.auntberthaqa.com/v3/authenticate", () => {
            return HttpResponse.json({
              success: true,
              data: {
                user_id: 1,
                token: "fake_auth_token_2",
              },
            });
          }),
        );

        // The second call should hit an authentication error, attempt to reauthenticate, and then successfully fetch the new programs
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

      test("should return formatted programs and internal opportunities", async () => {
        const returnedOpportunities =
          await testTRPCClient.opportunity.getOpportunities.query({
            includeFindHelpPrograms: true,
          });

        expect(returnedOpportunities).toEqual(
          expect.arrayContaining([
            expect.objectContaining({
              ...fakeOpportunity,
              source: "internal",
            }),
            expect.objectContaining({
              ...fakeOpportunity2,
              source: "internal",
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
              source: "external",
            }),
          ]),
        );
      });
    });
  });
});
