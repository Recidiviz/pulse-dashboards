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

import { FastifyInstance } from "fastify";

import { getPrismaClientForStateCode } from "~@jii-texting-server/prisma";
import { getAuthenticateTwilioWebhookRequestFn } from "~jii-texting-server/server/authUtils";
import { TwilioWebhookRequest } from "~jii-texting-server/server/types";

/**
 * Encapsulates the routes for Twilio webhooks
 * @param {FastifyInstance} server  Encapsulated Fastify Instance
 */
async function registerTwilioWebhooks(server: FastifyInstance) {
  // Instantiate the Twilio client
  if (!process.env["TWILIO_AUTH_TOKEN"]) {
    throw new Error(
      "Missing required environment variables for Twilio Auth Token in webhooks setup",
    );
  }

  const twilioAuthToken = process.env["TWILIO_AUTH_TOKEN"];

  server.post(
    "/webhook/twilio/incoming_message/:stateCode",
    {
      preHandler: [getAuthenticateTwilioWebhookRequestFn(twilioAuthToken)],
    },
    async (request: TwilioWebhookRequest, response) => {
      const { stateCode } = request.params;
      const prisma = getPrismaClientForStateCode(stateCode);

      request.log.info(
        `Incoming messaged received by webhook for ${stateCode}`,
      );

      const { OptOutType: optOutType, From: fromNumber } = request.body.values;

      // Remove the international code prefix, i.e. +1, for internal use
      const fromPhoneNumber = fromNumber.substring(2);

      // Find the people that have this phone number, if they exist
      const people = await prisma.person.findMany({
        where: {
          phoneNumber: fromPhoneNumber,
        },
      });

      if (!people) {
        request.log.info(
          `Received incoming message from phone number without associated Person`,
        );
      }

      // If the person exists and the person has opted out, update their record
      if (people && optOutType) {
        await prisma.person.updateMany({
          where: {
            phoneNumber: fromPhoneNumber,
          },
          data: {
            lastOptOutDate: new Date(),
          },
        });

        const updatedPseudonymizedIds: string[] = [];

        people.forEach((person) => {
          updatedPseudonymizedIds.push(person.pseudonymizedId);
        });

        request.log.info(
          `Updated opt-out for people: ${updatedPseudonymizedIds}`,
        );
      }

      // TODO(#7406): Write replies to BQ instead of DB
      response.status(200).send("Incoming message handled");
    },
  );
}

export default registerTwilioWebhooks;
