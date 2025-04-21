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

import { init } from "@sentry/node";
import sentryTestkit from "sentry-testkit";
import createTwilioClient, { Twilio } from "twilio";

import { TwilioAPIClient } from "../TwilioAPIClient";

const { testkit, sentryTransport } = sentryTestkit();

export { testkit };

export async function testAndGetSentryReports(expectedLength = 1) {
  // Use waitFor because sentry-testkit can be async
  const sentryReports = await vi.waitFor(async () => {
    const reports = testkit.reports();
    expect(reports).toHaveLength(expectedLength);

    return reports;
  });

  return sentryReports;
}

const mockCreateFn = vi.fn();

const mockTwilioClient = {
  messages: {
    create: mockCreateFn,
  },
} as unknown as Twilio;

vi.mock("twilio");

describe("TwilioAPIClient", () => {
  beforeEach(() => {
    vi.mocked(createTwilioClient).mockReturnValue(mockTwilioClient);

    init({
      dsn: process.env["SENTRY_DSN"],
      transport: sentryTransport,
    });
  });

  afterEach(() => {
    testkit.reset();
  });

  test("createMessage with subaccount", async () => {
    const client = new TwilioAPIClient("account-sid", "token", "subaccount");
    client.createMessage("Hello", "phonenumber");

    expect(mockCreateFn).toHaveBeenCalledExactlyOnceWith({
      body: "Hello",
      messagingServiceSid: "subaccount",
      to: "phonenumber",
    });
  });

  test("createMessage without subaccount", async () => {
    const client = new TwilioAPIClient("account-sid", "token");
    client.createMessage("Hello", "phonenumber");

    expect(mockCreateFn).toHaveBeenCalledExactlyOnceWith({
      body: "Hello",
      to: "phonenumber",
    });
  });

  test("scheduled createMessage without subaccount doesn't include MessagingServiceSid", async () => {
    const client = new TwilioAPIClient("account-sid", "token");
    await client.createMessage("Hello", "phonenumber", new Date(2025, 4, 1));

    const sentryReports = await testAndGetSentryReports();
    expect(sentryReports[0].error?.message).toContain(
      "Attempted to schedule send message without MessagingServiceSid. Check Twilio for messages that might have been sent earlier than expected",
    );

    expect(mockCreateFn).toHaveBeenCalledExactlyOnceWith({
      body: "Hello",
      to: "phonenumber",
      sendAt: new Date(2025, 4, 1),
      scheduleType: "fixed",
    });
  });

  test("scheduled createMessage with subaccount includes MessagingServiceSid", async () => {
    const client = new TwilioAPIClient("account-sid", "token", "subaccount");
    await client.createMessage("Hello", "phonenumber", new Date(2025, 4, 1));

    expect(mockCreateFn).toHaveBeenCalledExactlyOnceWith({
      body: "Hello",
      to: "phonenumber",
      messagingServiceSid: "subaccount",
      sendAt: new Date(2025, 4, 1),
      scheduleType: "fixed",
    });
  });
});
