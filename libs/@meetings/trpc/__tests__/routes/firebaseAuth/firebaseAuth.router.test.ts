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

import { beforeEach, describe, expect, test } from "vitest";

import {
  initFastifyAndSetUser,
  mockCreateCustomToken,
  testTRPCClient,
} from "~@meetings/trpc/test/setup";
import { fakeStaff } from "~@meetings/trpc/test/setup/seed";

describe("firebaseAuth router", () => {
  describe("getFirebaseToken", () => {
    beforeEach(() => {
      mockCreateCustomToken.mockClear();
    });

    test("mints a token with the caller's own state code for a non-Recidiviz user", async () => {
      // The shared setup's default beforeEach already logs in fakeStaff[0]
      // with app_metadata.stateCode "US_NE" and no allowedStates.
      const result =
        await testTRPCClient.v1.firebaseAuth.getFirebaseToken.query();

      expect(result).toEqual({ firebaseToken: "fake-firebase-token" });
      expect(mockCreateCustomToken).toHaveBeenCalledWith(fakeStaff[0].email, {
        app: "meetings",
        stateCode: "US_NE",
        recidivizAllowedStates: [],
        impersonator: false,
      });
    });

    test("mints a token with the literal RECIDIVIZ state code for a non-impersonating Recidiviz user", async () => {
      await initFastifyAndSetUser(
        {
          "https://dashboard.recidiviz.org/email_address":
            "recidiviz-user@recidiviz.org",
          "https://dashboard.recidiviz.org/app_metadata": {
            stateCode: "recidiviz",
            // "US_NE" (properly cased) is required for the requested-state
            // permission check in context.ts to pass; "us_id" is additional
            // and just here to verify getFirebaseToken uppercases it.
            allowedStates: ["US_NE", "us_id"],
          },
        },
        { stateCode: "US_NE" },
      );

      await testTRPCClient.v1.firebaseAuth.getFirebaseToken.query();

      expect(mockCreateCustomToken).toHaveBeenCalledWith(
        "recidiviz-user@recidiviz.org",
        {
          app: "meetings",
          stateCode: "RECIDIVIZ",
          recidivizAllowedStates: ["US_NE", "US_ID"],
          impersonator: false,
        },
      );
    });

    test("mints a token with the impersonated state code and impersonator true", async () => {
      await initFastifyAndSetUser(
        {
          "https://dashboard.recidiviz.org/email_address":
            "recidiviz-user@recidiviz.org",
          "https://dashboard.recidiviz.org/app_metadata": {
            stateCode: "recidiviz",
            allowedStates: ["US_NE"],
          },
        },
        {
          stateCode: "US_NE",
          extraHeaders: { "X-Impersonated-Email": "impersonated@example.com" },
        },
      );

      await testTRPCClient.v1.firebaseAuth.getFirebaseToken.query();

      expect(mockCreateCustomToken).toHaveBeenCalledWith(
        "impersonated@example.com",
        {
          app: "meetings",
          stateCode: "US_NE",
          recidivizAllowedStates: ["US_NE"],
          impersonator: true,
        },
      );
    });

    test("throws UNAUTHORIZED when the caller isn't authenticated", async () => {
      await initFastifyAndSetUser(undefined);

      await expect(
        testTRPCClient.v1.firebaseAuth.getFirebaseToken.query(),
      ).rejects.toMatchObject({ data: { code: "UNAUTHORIZED" } });

      expect(mockCreateCustomToken).not.toHaveBeenCalled();
    });
  });
});
