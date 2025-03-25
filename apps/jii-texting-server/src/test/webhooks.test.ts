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

// import MockDate from "mockdate";
import { describe, test } from "vitest";

import { testPrismaClient, testServer } from "~jii-texting-server/test/setup";
import { fakePerson } from "~jii-texting-server/test/setup/seed";

describe("twilio_incoming_message", () => {
  test("incoming message from existing person persisted in DB successfully", async () => {
    const existingPersonPhoneNumber = fakePerson.phoneNumber;
    const twilioMessageSid = "incoming-message-sid-1";

    const response = await testServer.inject({
      method: "POST",
      url: "/webhook/twilio_incoming_message/US_ID",
      payload: {
        values: {
          MessageSid: twilioMessageSid,
          From: `+1${existingPersonPhoneNumber}`,
          Body: "This is a reply",
          OptOutType: "STOP",
        },
      },
    });

    expect(response).toMatchObject({
      statusCode: 200,
    });

    const person = await testPrismaClient.person.findFirst({
      where: {
        phoneNumber: existingPersonPhoneNumber,
      },
    });

    // Validate person has opted out
    expect(person?.lastOptOutDate).not.toBeNull();
  });

  test("incoming message success for non-existent person", async () => {
    const twilioMessageSid = "incoming-message-sid-1";

    const response = await testServer.inject({
      method: "POST",
      url: "/webhook/twilio_incoming_message/US_ID",
      payload: {
        values: {
          MessageSid: twilioMessageSid,
          From: `+11111111111`,
          Body: "This is a reply",
        },
      },
    });

    expect(response).toMatchObject({
      statusCode: 200,
    });
  });
});
