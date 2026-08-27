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
  });
});
