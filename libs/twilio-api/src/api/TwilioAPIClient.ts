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

import { ITwilioAPI } from "./interface";

export class TwilioAPIClient implements ITwilioAPI {
  private client: Twilio;

  private subaccountSid?: string;

  constructor(accountSid: string, authToken: string, subaccountSid?: string) {
    this.client = createTwilioClient(accountSid, authToken);

    this.subaccountSid = subaccountSid;
  }

  async createMessage(body: string, recipientPhoneNumber: string) {
    const createMessageBody = {
      body: body,
      to: recipientPhoneNumber,
    };

    const message = await this.client.messages.create({
      ...createMessageBody,
      ...(this.subaccountSid === undefined
        ? {}
        : { messagingServiceSid: this.subaccountSid }),
    });

    return message;
  }
}
