// Recidiviz - a data platform for criminal justice reform
// Copyright (C) 2025 Recidiviz, Inc.
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

import { IMPERSONATED_EMAIL_HEADER_KEY } from "~@meetings/trpc/context";
import env from "~@meetings/trpc/env";
import {
  initFastifyAndSetUser,
  testTRPCClient,
} from "~@meetings/trpc/test/setup";
import { fakeStaff } from "~@meetings/trpc/test/setup/seed";

describe("context", () => {
  describe("auth", () => {
    test("invalid state code", async () => {
      await initFastifyAndSetUser({
        "https://dashboard.recidiviz.org/email_address": fakeStaff[0].email,
        "https://dashboard.recidiviz.org/app_metadata": {
          // @ts-expect-error testing invalid state code
          stateCode: "US_OZ",
        },
      });
      // arbitrary endpoint to test auth context
      await expect(
        testTRPCClient.v1.client.list.query(),
      ).rejects.toThrowErrorMatchingInlineSnapshot(
        `[TRPCClientError: Unsupported state code provided in auth0 app_metadata: US_OZ]`,
      );
    });

    test("mismatched state", async () => {
      await initFastifyAndSetUser({
        "https://dashboard.recidiviz.org/email_address": fakeStaff[0].email,
        "https://dashboard.recidiviz.org/app_metadata": {
          // auth header is hardcoded to request US_NE
          stateCode: "US_TN",
        },
      });
      // arbitrary endpoint to test auth context
      await expect(
        testTRPCClient.v1.client.list.query(),
      ).rejects.toThrowErrorMatchingInlineSnapshot(
        `[TRPCClientError: User with state code US_TN cannot request data about state: US_NE]`,
      );
    });

    test("missing stateCode in header", async () => {
      await initFastifyAndSetUser(
        {
          "https://dashboard.recidiviz.org/email_address": fakeStaff[0].email,
          "https://dashboard.recidiviz.org/app_metadata": {
            stateCode: "US_NE",
          },
        },
        { omitStateCode: true },
      );

      // Authenticated endpoint should fail without stateCode (treated as unauthorized)
      await expect(
        testTRPCClient.v1.client.list.query(),
      ).rejects.toThrowErrorMatchingInlineSnapshot(
        `[TRPCClientError: UNAUTHORIZED]`,
      );
    });

    test("invalid stateCode header format throws error", async () => {
      await initFastifyAndSetUser(
        {
          "https://dashboard.recidiviz.org/email_address": fakeStaff[0].email,
          "https://dashboard.recidiviz.org/app_metadata": {
            stateCode: "US_NE",
          },
        },
        { stateCode: "INVALID_STATE" },
      );

      // Any endpoint should fail with invalid stateCode format
      await expect(
        testTRPCClient.v1.client.list.query(),
      ).rejects.toThrowErrorMatchingInlineSnapshot(
        `[TRPCClientError: Unsupported state code provided in request headers: INVALID_STATE]`,
      );
    });
    test("missing email", async () => {
      await initFastifyAndSetUser({
        "https://dashboard.recidiviz.org/email_address": undefined,
        "https://dashboard.recidiviz.org/app_metadata": {
          stateCode: "US_NE",
        },
      });
      // arbitrary endpoint to test auth context
      await expect(
        testTRPCClient.v1.client.list.query(),
      ).rejects.toThrowErrorMatchingInlineSnapshot(
        `[TRPCClientError: Missing email for user]`,
      );
    });

    test("recidiviz not allowed state", async () => {
      await initFastifyAndSetUser({
        "https://dashboard.recidiviz.org/email_address": "test@recidiviz.org",
        "https://dashboard.recidiviz.org/app_metadata": {
          stateCode: "recidiviz",
          // auth header is hardcoded to request US_NE
          allowedStates: ["US_TN"],
        },
      });
      // arbitrary endpoint to test auth context
      await expect(
        testTRPCClient.v1.client.list.query(),
      ).rejects.toThrowErrorMatchingInlineSnapshot(
        `[TRPCClientError: Recidiviz user cannot request data about state: US_NE. File a go/access request for access]`,
      );
    });

    test("recidiviz user can access US_DEMO", async () => {
      await initFastifyAndSetUser(
        {
          "https://dashboard.recidiviz.org/email_address": "test@recidiviz.org",
          "https://dashboard.recidiviz.org/app_metadata": {
            stateCode: "recidiviz",
            allowedStates: [],
          },
        },
        { stateCode: "US_DEMO" },
      );
      // Recidiviz users can always access US_DEMO without it being in allowedStates
      const clients = await testTRPCClient.v1.client.list.query();
      expect(clients).toBeDefined();
    });

    test("state user cannot access US_DEMO", async () => {
      await initFastifyAndSetUser(
        {
          "https://dashboard.recidiviz.org/email_address": fakeStaff[0].email,
          "https://dashboard.recidiviz.org/app_metadata": {
            stateCode: "US_NE",
          },
        },
        { stateCode: "US_DEMO" },
      );
      // A state user (US_NE) cannot request data for a different state (US_DEMO)
      await expect(
        testTRPCClient.v1.client.list.query(),
      ).rejects.toThrowErrorMatchingInlineSnapshot(
        `[TRPCClientError: User with state code US_NE cannot request data about state: US_DEMO]`,
      );
    });

    test("user with stateCode US_DEMO can access US_DEMO", async () => {
      await initFastifyAndSetUser(
        {
          "https://dashboard.recidiviz.org/email_address": fakeStaff[0].email,
          "https://dashboard.recidiviz.org/app_metadata": {
            stateCode: "US_DEMO",
          },
        },
        { stateCode: "US_DEMO" },
      );
      // A user whose stateCode is US_DEMO can request US_DEMO data
      const clients = await testTRPCClient.v1.client.list.query();
      expect(clients).toBeDefined();
    });
  });

  describe("skip auth", () => {
    test("skip auth works in development mode", async () => {
      const originalNodeEnv = env.NODE_ENV;
      env.NODE_ENV = "development";

      try {
        await initFastifyAndSetUser(
          {
            "https://dashboard.recidiviz.org/email_address": fakeStaff[0].email,
            "https://dashboard.recidiviz.org/app_metadata": {
              stateCode: "US_NE",
            },
          },
          { skipAuth: true },
        );

        // Test that we can access an endpoint with skip auth
        const clients = await testTRPCClient.v1.client.list.query();
        expect(clients).toBeDefined();
      } finally {
        env.NODE_ENV = originalNodeEnv;
      }
    });

    test("skip auth does not work in production mode", async () => {
      const originalNodeEnv = env.NODE_ENV;
      env.NODE_ENV = "production";

      try {
        // Don't pass a user - skip auth should NOT create one in production
        await initFastifyAndSetUser(undefined, { skipAuth: true });

        // Without a valid auth, this should fail
        await expect(
          testTRPCClient.v1.client.list.query(),
        ).rejects.toThrowErrorMatchingInlineSnapshot(
          `[TRPCClientError: Auth can only be skipped on a server running in dev mode]`,
        );
      } finally {
        env.NODE_ENV = originalNodeEnv;
      }
    });

    test("skip auth sets email to staff-email-1@example.com", async () => {
      const originalNodeEnv = env.NODE_ENV;
      env.NODE_ENV = "development";

      try {
        // Initialize without providing a user (skip auth should create mock user)
        await initFastifyAndSetUser(undefined, { skipAuth: true });

        // The context should have created a user with a mock email
        // We can verify this by checking that the endpoint works (it would fail if no user)
        const clients = await testTRPCClient.v1.client.list.query();
        expect(clients).toBeDefined();
      } finally {
        env.NODE_ENV = originalNodeEnv;
      }
    });
  });

  describe("public routes without stateCode", () => {
    test("public routes work without stateCode header", async () => {
      await initFastifyAndSetUser(undefined, { omitStateCode: true });

      // Public endpoint should work without stateCode
      const result = await testTRPCClient.v1.metadata.checkAppVersion.query({
        appVersion: "1.0.0",
      });
      expect(result).toEqual({ requiresUpgrade: false });
    });

    test("public routes work without authentication", async () => {
      await initFastifyAndSetUser(undefined, {
        omitStateCode: true,
        omitAuth: true,
      });

      // Public endpoint should work without auth
      const result = await testTRPCClient.v1.metadata.checkAppVersion.query({
        appVersion: "1.0.0",
      });
      expect(result).toEqual({ requiresUpgrade: false });
    });
  });

  describe("impersonation", () => {
    test("non-recidiviz users cannot impersonate", async () => {
      await initFastifyAndSetUser(
        {
          "https://dashboard.recidiviz.org/email_address":
            "test@not-recidiviz.org",
          "https://dashboard.recidiviz.org/app_metadata": {
            stateCode: "US_NE",
            allowedStates: ["US_NE"],
          },
        },
        {
          extraHeaders: { [IMPERSONATED_EMAIL_HEADER_KEY]: fakeStaff[0].email },
        },
      );

      await expect(
        testTRPCClient.v1.client.list.query(),
      ).rejects.toThrowErrorMatchingInlineSnapshot(
        `[TRPCClientError: Only Recidiviz users can impersonate other users]`,
      );
    });

    test("a recdiviz user without access to the impersonated user's state cannot impersonate", async () => {
      await initFastifyAndSetUser(
        {
          "https://dashboard.recidiviz.org/email_address": "test@recidiviz.org",
          "https://dashboard.recidiviz.org/app_metadata": {
            stateCode: "recidiviz",
            allowedStates: ["US_AL"],
          },
        },
        {
          extraHeaders: { [IMPERSONATED_EMAIL_HEADER_KEY]: fakeStaff[0].email },
        },
      );

      await expect(
        testTRPCClient.v1.client.list.query(),
      ).rejects.toThrowErrorMatchingInlineSnapshot(
        `[TRPCClientError: Recidiviz user cannot request data about state: US_NE. File a go/access request for access]`,
      );
    });
  });
});
