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

import { FastifyRequest } from "fastify";

export type RequestWithStateCodeParam = FastifyRequest<{
  Params: {
    stateCode: string;
  };
}>;

// Derived from https://www.twilio.com/docs/messaging/guides/webhook-request
export interface TwilioIncomingMessageRequestType {
  MessageSid: string;
  From: string;
  To: string;
  Body: string;
  OptOutType?: string;
  AccountSid: string;
  MessagingServiceSid: string;
}

export type TwilioWebhookRequest = FastifyRequest<{
  Body: TwilioIncomingMessageRequestType;
  Params: {
    stateCode: string;
  };
}>;
