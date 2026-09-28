// Recidiviz - a data platform for criminal justice reform
// Copyright (C) 2026 Recidiviz, Inc.
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

import { gaxios } from "google-auth-library";
import { beforeEach, describe, expect, test } from "vitest";

import env from "~@meetings/trpc/env";
import {
  initFastifyAndSetUser,
  mockGoogleAuthRequest,
  testTRPCClient,
} from "~@meetings/trpc/test/setup";
import { fakeStaff } from "~@meetings/trpc/test/setup/seed";

function fakeGaxiosError(status: number): gaxios.GaxiosError {
  const error = new gaxios.GaxiosError(
    `Request failed with status code ${status}`,
    {},
  );
  error.status = status;
  return error;
}

describe("impersonation router", () => {
  describe("lookupUser", () => {
    beforeEach(async () => {
      mockGoogleAuthRequest.mockReset();

      await initFastifyAndSetUser({
        "https://dashboard.recidiviz.org/email_address": fakeStaff[0].email,
        "https://dashboard.recidiviz.org/app_metadata": {
          stateCode: "recidiviz", // Only Recidiviz users can make impersonation requests
          allowedStates: ["US_NE"],
        },
      });
    });

    test("throws NOT_FOUND with the email when the Data API has no matching user", async () => {
      mockGoogleAuthRequest.mockRejectedValueOnce(fakeGaxiosError(404));

      await expect(
        testTRPCClient.v1.impersonation.lookupUser.query({
          email: "unknown@example.com",
        }),
      ).rejects.toMatchObject({
        message: "No user found for email: unknown@example.com",
        data: { code: "NOT_FOUND" },
      });
    });

    test("throws INTERNAL_SERVER_ERROR and reports to Sentry for other Data API failures", async () => {
      mockGoogleAuthRequest.mockRejectedValueOnce(fakeGaxiosError(500));

      await expect(
        testTRPCClient.v1.impersonation.lookupUser.query({
          email: "someone@example.com",
        }),
      ).rejects.toMatchObject({
        message:
          "Failed to fetch impersonated user for email: someone@example.com",
        data: { code: "INTERNAL_SERVER_ERROR" },
      });
    });

    test("unauthenticated caller cannot bypass authorization by omitting statecode and setting x-skip-auth", async () => {
      await initFastifyAndSetUser(undefined, {
        omitStateCode: true,
        omitAuth: true,
        extraHeaders: { "X-Skip-Auth": "true" },
      });

      await expect(
        testTRPCClient.v1.impersonation.lookupUser.query({
          email: fakeStaff[0].email,
        }),
      ).rejects.toThrowErrorMatchingInlineSnapshot(
        `[TRPCClientError: FORBIDDEN]`,
      );
    });

    test("skip auth still works for the legitimate offline/dev escape hatch (stateCode + x-skip-auth present, dev mode)", async () => {
      mockGoogleAuthRequest.mockResolvedValueOnce({
        data: { stateCode: "US_NE" },
      });

      const originalNodeEnv = env.NODE_ENV;
      env.NODE_ENV = "development";

      try {
        await initFastifyAndSetUser(undefined, { skipAuth: true });

        const result = await testTRPCClient.v1.impersonation.lookupUser.query({
          email: fakeStaff[0].email,
        });
        expect(result).toEqual({ stateCode: "US_NE" });
      } finally {
        env.NODE_ENV = originalNodeEnv;
      }
    });

    test("does not leak the target user's stateCode when the caller lacks access to it", async () => {
      // The target user being looked up belongs to a different state than
      // the caller (who only has access to US_NE) is allowed to access.
      mockGoogleAuthRequest.mockResolvedValueOnce({
        data: { stateCode: "US_AZ" },
      });

      const rejection = testTRPCClient.v1.impersonation.lookupUser.query({
        email: "target@example.com",
      });

      await expect(rejection).rejects.toMatchObject({
        data: { code: "FORBIDDEN" },
      });

      await rejection.catch((error) => {
        expect(String(error?.message)).not.toContain("US_AZ");
      });
    });
  });
});
