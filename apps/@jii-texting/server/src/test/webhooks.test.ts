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
import { beforeAll, beforeEach, describe, expect, test, vi } from "vitest";

import { sendLanguageConfirmation } from "~@jii-texting/server/server/webhooks";
import {
  idahoTestPrismaClient,
  mockDatasetFn,
  mockTableFn,
  testHost,
  testPort,
  testServer,
  texasTestPrismaClient,
} from "~@jii-texting/server/test/setup";
import { i18nInstance, initI18n } from "~@jii-texting/utils/common/i18n";
import { fakePersonOne } from "~@jii-texting/utils/test/constants";
import { getTwilioClientForStateCode, TwilioAPIClient } from "~twilio-api";

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

      const persons = await idahoTestPrismaClient.person.findMany({
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

    test("idaho incoming message cannot set language preference", async () => {
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
          Body: "spanish",
        }).toString(),
      });

      expect(response).toMatchObject({
        statusCode: 200,
      });

      expect(TwilioAPIClient.prototype.createMessage).toHaveBeenCalledTimes(0);

      const persons = await idahoTestPrismaClient.person.findMany({
        where: {
          phoneNumber: existingPersonPhoneNumber,
        },
      });

      expect(persons.length).toBe(1);
      // Validate person's language preference has not changed (still default value 'en')
      expect(persons[0].preferredLanguage).toBe("en");

      expect(mockDatasetFn).toHaveBeenCalledOnce();

      expect(mockTableFn).toHaveBeenCalledOnce();
    });

    test("START message from existing person resets lastOptOutDate", async () => {
      // Set up test so that the person has opted out
      const person = await idahoTestPrismaClient.person.update({
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

      const updatedPerson = await idahoTestPrismaClient.person.findFirstOrThrow(
        {
          where: {
            personId: person.personId,
          },
        },
      );

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

describe("POST /webhook/twilio/incoming_message/US_TX", () => {
  describe("authenticated requests", () => {
    beforeEach(() => {
      vi.mocked(validateRequest).mockReturnValueOnce(true);
    });

    test("texas incoming message can set language preference", async () => {
      const existingPersonPhoneNumber = fakePersonOne.phoneNumber;
      const twilioMessageSid = "incoming-message-sid-1";

      const response = await testServer.inject({
        method: "POST",
        url: "/webhook/twilio/incoming_message/US_TX",
        headers: {
          "x-twilio-signature": "signature",
          "content-type": "application/x-www-form-urlencoded",
        },
        payload: new URLSearchParams({
          MessageSid: twilioMessageSid,
          From: `+1${existingPersonPhoneNumber}`,
          Body: "spanish",
        }).toString(),
      });

      expect(response).toMatchObject({
        statusCode: 200,
      });

      expect(TwilioAPIClient.prototype.createMessage).toHaveBeenCalledOnce();

      const persons = await texasTestPrismaClient.person.findMany({
        where: {
          phoneNumber: existingPersonPhoneNumber,
        },
      });

      expect(persons.length).toBe(1);
      // Validate person's language preference has changed
      expect(persons[0].preferredLanguage).toBe("es");

      expect(mockDatasetFn).toHaveBeenCalledExactlyOnceWith(
        "twilio_webhook_requests",
      );
      expect(mockTableFn).toHaveBeenCalledExactlyOnceWith(
        "jii_texting_incoming_messages",
      );
    });

    test("texas incoming message invalid language preference keyword", async () => {
      const existingPersonPhoneNumber = fakePersonOne.phoneNumber;
      const twilioMessageSid = "incoming-message-sid-1";

      const response = await testServer.inject({
        method: "POST",
        url: "/webhook/twilio/incoming_message/US_TX",
        headers: {
          "x-twilio-signature": "signature",
          "content-type": "application/x-www-form-urlencoded",
        },
        payload: new URLSearchParams({
          MessageSid: twilioMessageSid,
          From: `+1${existingPersonPhoneNumber}`,
          Body: "german",
        }).toString(),
      });

      expect(response).toMatchObject({
        statusCode: 200,
      });

      expect(TwilioAPIClient.prototype.createMessage).toHaveBeenCalledTimes(0);
    });
  });
});

describe("sendLanguageConfirmation", () => {
  beforeAll(async () => {
    await initI18n();
  });

  beforeEach(() => {
    vi.clearAllMocks();
  });

  test("sends English confirmation message with correct body", () => {
    const expectedEnglishMessage =
      "All future messages will be in English.\n\nSi prefiere recibir estos mensajes en español, responda con el número 2 en cualquier momento.\n\nReply STOP to stop receiving these messages at any time. We're unable to respond to messages sent to this number.";

    sendLanguageConfirmation("US_TX", "5551234567", "en", i18nInstance);

    expect(getTwilioClientForStateCode).toHaveBeenCalledWith("US_TX");
    expect(TwilioAPIClient.prototype.createMessage).toHaveBeenCalledWith(
      expectedEnglishMessage,
      "5551234567",
    );
  });

  test("sends Spanish confirmation message with correct body", () => {
    const expectedSpanishMessage =
      "A partir de hoy, todos los mensajes se enviarán en español.\n\nIf you prefer to receive these messages in English, respond 1 at any time.\n\nResponde STOP para dejar de recibir estos mensajes en cualquier momento. No podemos responder a los mensajes enviados a este número.";

    sendLanguageConfirmation("US_TX", "5551234567", "es", i18nInstance);

    expect(getTwilioClientForStateCode).toHaveBeenCalledWith("US_TX");
    expect(TwilioAPIClient.prototype.createMessage).toHaveBeenCalledWith(
      expectedSpanishMessage,
      "5551234567",
    );
  });
});
