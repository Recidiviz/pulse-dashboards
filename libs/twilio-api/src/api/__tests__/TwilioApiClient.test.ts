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

import createTwilioClient, { Twilio } from "twilio";

import { TwilioAPIClient } from "../TwilioAPIClient";

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
});
