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

import Sentry from "@sentry/nextjs";
import { randomUUID } from "crypto";
import { beforeAll, describe, expect, it } from "vitest";

describe("Sentry Integration Tests", () => {
  beforeAll(() => {
    console.log("Sentry Configuration Check:");
    console.log(
      "NEXT_PUBLIC_SENTRY_DSN (client):",
      process.env["NEXT_PUBLIC_SENTRY_DSN"] || "NOT SET",
    );

    if (!process.env["NEXT_PUBLIC_SENTRY_DSN"]) {
      throw new Error(
        "NEXT_PUBLIC_SENTRY_DSN environment variable is required for Sentry integration tests",
      );
    }

    if (process.env["NEXT_PUBLIC_SENTRY_DSN"]) {
      console.log("Initializing Sentry with DSN...");
      Sentry.init({
        dsn: process.env["NEXT_PUBLIC_SENTRY_DSN"],
        environment: "development",
        debug: true,
        release: "integration-test@1.0.0",
        sampleRate: 1.0,
        beforeSend: (event) => {
          console.log(
            "Sentry beforeSend: Event being sent to Sentry",
            event.event_id,
          );
          return event;
        },
      });
      console.log(" Sentry initialized for integration test");
    }

    const client = Sentry.getClient();
    if (client) {
      const options = client.getOptions();
      console.log("DSN configured:", options.dsn || "NO DSN");
      console.log("Environment:", options.environment || "NO ENVIRONMENT SET");
      console.log("Debug mode:", options.debug || false);
    } else {
      console.log("No Sentry client found - Sentry may not be initialized");
    }
  });

  it("should send a real test exception to Sentry", async () => {
    const testUUID = randomUUID();
    const testError = new Error(
      `Integration test message from @reentry/frontend [${testUUID}]`,
    );
    testError.stack = `Test stack trace from integration test [${testUUID}]`;

    console.log(`Sending test exception to Sentry with UUID: ${testUUID}`);

    const eventId = Sentry.withScope((scope) => {
      console.log("Setting up Sentry scope with tags and context...");

      scope.setTag("test_uuid", testUUID);
      scope.setTag("test_type", "integration");
      scope.setContext("test_info", {
        uuid: testUUID,
        timestamp: new Date().toISOString(),
        component: "frontend-integration-test",
      });

      console.log("Calling Sentry.captureException...");
      const id = Sentry.captureException(testError);
      console.log(`Sentry.captureException returned event ID: ${id}`);

      return id;
    });

    console.log(`Test Results:`);
    console.log(`Event ID: ${eventId}`);
    console.log(`Event ID type: ${typeof eventId}`);
    console.log(`Event ID length: ${eventId?.length || 0}`);

    expect(eventId).toBeDefined();
    expect(typeof eventId).toBe("string");
    expect(eventId.length).toBeGreaterThan(0);

    console.log(`Integration test completed successfully!`);
    console.log(`Search in Sentry dashboard: UUID: ${testUUID}`);

    // Add a small delay to ensure the event has time to be sent
    console.log("Waiting 2 seconds for Sentry to process the event...");
    await Sentry.flush(2000);
    console.log("Done waiting - check your Sentry dashboard now!");
  });
});
