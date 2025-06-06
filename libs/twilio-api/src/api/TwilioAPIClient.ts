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

import { captureException } from "@sentry/node";
import createTwilioClient, { Twilio } from "twilio";

import { ITwilioAPI } from "./interface";

export class TwilioAPIClient implements ITwilioAPI {
  private client: Twilio;

  private subaccountSid?: string;

  constructor(accountSid: string, authToken: string, subaccountSid?: string) {
    this.client = createTwilioClient(accountSid, authToken);

    this.subaccountSid = subaccountSid;
  }

  async createMessage(
    body: string,
    recipientPhoneNumber: string,
    sendAt?: Date,
  ) {
    const createMessageBody = {
      body: body,
      to: recipientPhoneNumber,
    };

    if (sendAt !== undefined && this.subaccountSid === undefined) {
      // In order to schedule send a message, the messagingServiceSid parameter must have a value
      // Otherwise, it will be sent immediately
      // As determined by https://www.twilio.com/docs/messaging/features/message-scheduling
      console.log(`Sent message immediately, rather than scheduled`);
      captureException(
        `Attempted to schedule send message without MessagingServiceSid. Check Twilio for messages that might have been sent earlier than expected`,
      );
    }

    const message = await this.client.messages.create({
      ...createMessageBody,
      ...(this.subaccountSid === undefined
        ? {}
        : { messagingServiceSid: this.subaccountSid }),
      ...(sendAt === undefined
        ? {}
        : { sendAt: sendAt, scheduleType: "fixed" }),
    });

    return message;
  }

  async getMessage(messageSid: string) {
    return await this.client.messages(messageSid).fetch();
  }
}
