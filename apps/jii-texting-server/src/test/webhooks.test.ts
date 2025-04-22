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

import { validateRequest } from "twilio/lib/webhooks/webhooks";
import { beforeEach, describe, expect, test, vi } from "vitest";

import { fakePersonOne } from "~@jii-texting/utils/test/constants";
import {
  mockDatasetFn,
  mockTableFn,
  testHost,
  testPort,
  testPrismaClient,
  testServer,
} from "~jii-texting-server/test/setup";

describe("POST /webhook/twilio/incoming_message/US_ID", () => {
  describe("authenticated requests", () => {
    beforeEach(() => {
      vi.mocked(validateRequest).mockReturnValueOnce(true);
    });

    test("incoming message from existing person persisted in DB successfully", async () => {
      const existingPersonPhoneNumber = fakePersonOne.phoneNumber;
      const twilioMessageSid = "incoming-message-sid-1";

      const response = await testServer.inject({
        method: "POST",
        url: "/webhook/twilio/incoming_message/US_ID",
        headers: {
          "x-twilio-signature": "signature",
          "content-type": "application/x-www-form-urlencoded",
        },
        payload: new URLSearchParams({
          MessageSid: twilioMessageSid,
          From: `+1${existingPersonPhoneNumber}`,
          Body: "This is a reply",
          OptOutType: "STOP",
        }).toString(),
      });

      expect(response).toMatchObject({
        statusCode: 200,
      });

      const persons = await testPrismaClient.person.findMany({
        where: {
          phoneNumber: existingPersonPhoneNumber,
        },
      });

      expect(persons.length).toBe(1);
      // Validate person has opted out
      expect(persons[0].lastOptOutDate).not.toBeNull();

      expect(mockDatasetFn).toHaveBeenCalledExactlyOnceWith(
        "twilio_webhook_requests",
      );
      expect(mockTableFn).toHaveBeenCalledExactlyOnceWith(
        "jii_texting_incoming_messages",
      );
    });

    test("START message from existing person resets lastOptOutDate", async () => {
      // Set up test so that the person has opted out
      const person = await testPrismaClient.person.update({
        where: {
          personId: fakePersonOne.personId,
        },
        data: {
          lastOptOutDate: new Date(),
        },
      });

      const twilioMessageSid = "incoming-message-sid-1";

      const response = await testServer.inject({
        method: "POST",
        url: "/webhook/twilio/incoming_message/US_ID",
        headers: {
          "x-twilio-signature": "signature",
          "content-type": "application/x-www-form-urlencoded",
        },
        payload: new URLSearchParams({
          MessageSid: twilioMessageSid,
          From: `+1${person.phoneNumber}`,
          Body: "START",
          OptOutType: "START",
        }).toString(),
      });

      expect(response).toMatchObject({
        statusCode: 200,
      });

      const updatedPerson = await testPrismaClient.person.findFirstOrThrow({
        where: {
          personId: person.personId,
        },
      });

      // Validate person lastOptOutDate reset
      expect(updatedPerson.lastOptOutDate).toBeNull();
    });

    test("incoming message success for non-existent person", async () => {
      const twilioMessageSid = "incoming-message-sid-1";

      const response = await testServer.inject({
        method: "POST",
        url: "/webhook/twilio/incoming_message/US_ID",
        headers: {
          "x-twilio-signature": "signature",
          "content-type": "application/x-www-form-urlencoded",
        },
        payload: new URLSearchParams({
          MessageSid: twilioMessageSid,
          From: `+11111111111`,
          Body: "This is a reply",
        }).toString(),
      });

      expect(response).toMatchObject({
        statusCode: 200,
      });
    });
  });

  describe("unauthenticated requests", () => {
    test("no twilio signature provided", async () => {
      const existingPersonPhoneNumber = fakePersonOne.phoneNumber;
      const twilioMessageSid = "incoming-message-sid-1";

      const response = await testServer.inject({
        method: "POST",
        url: "/webhook/twilio/incoming_message/US_ID",
        headers: {
          "content-type": "application/x-www-form-urlencoded",
        },
        payload: new URLSearchParams({
          MessageSid: twilioMessageSid,
          From: `+1${existingPersonPhoneNumber}`,
          Body: "This is a reply",
          OptOutType: "STOP",
        }).toString(),
      });

      expect(response.statusCode).toBe(403);
      expect(JSON.parse(response.body)).toMatchObject({
        error: "Missing Twilio signature",
      });
    });

    test("signature provided, but invalid request", async () => {
      vi.mocked(validateRequest).mockReturnValueOnce(false);

      const existingPersonPhoneNumber = fakePersonOne.phoneNumber;
      const twilioMessageSid = "incoming-message-sid-1";

      const requestParams: Record<string, string> = {
        MessageSid: twilioMessageSid,
        From: `+1${existingPersonPhoneNumber}`,
        Body: "This is a reply",
        OptOutType: "STOP",
      };

      const response = await testServer.inject({
        method: "POST",
        url: "/webhook/twilio/incoming_message/US_ID",
        headers: {
          "x-twilio-signature": "signature",
          "content-type": "application/x-www-form-urlencoded",
          host: `localhost:${testPort}`,
        },
        payload: new URLSearchParams(requestParams).toString(),
      });

      expect(response.statusCode).toBe(403);
      expect(JSON.parse(response.body)).toMatchObject({
        error: "Invalid Twilio request",
      });

      expect(validateRequest).toHaveBeenCalledWith(
        "test-token",
        "signature",
        `http://${testHost}:${testPort}/webhook/twilio/incoming_message/US_ID`,
        requestParams,
      );
    });
  });
});
