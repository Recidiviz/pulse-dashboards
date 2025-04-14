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

import { BigQuery } from "@google-cloud/bigquery";
import { captureException } from "@sentry/node";
import { FastifyInstance } from "fastify";

import { getPrismaClientForStateCode } from "~@jii-texting-server/prisma";
import { BQ_DATASET_ID, BQ_REPLIES_VIEW_ID } from "~@jii-texting-server/utils";
import { getAuthenticateTwilioWebhookRequestFn } from "~jii-texting-server/server/authUtils";
import { TwilioWebhookRequest } from "~jii-texting-server/server/types";
import { isOptOut } from "~jii-texting-server/server/utils";

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

      const { OptOutType: optOutType, From: fromNumber } = request.body;

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
        const isValidOptOut = isOptOut(optOutType);

        await prisma.person.updateMany({
          where: {
            phoneNumber: fromPhoneNumber,
          },
          data: {
            lastOptOutDate: isValidOptOut ? new Date() : null,
          },
        });

        const updatedPseudoIds = people.map((person) => {
          return person.pseudonymizedId;
        });

        request.log.info(`Updated opt-out for people: ${updatedPseudoIds}`);
      }

      try {
        const bigQueryClient = new BigQuery({
          projectId: process.env["DATA_PLATFORM_PROJECT_ID"],
        });

        await bigQueryClient
          .dataset(BQ_DATASET_ID)
          .table(BQ_REPLIES_VIEW_ID)
          .insert({
            ...request.body,
            From: fromPhoneNumber,
            TimeReceived: new Date().toISOString(),
          });
      } catch (e) {
        captureException(`Failed to write incoming message to BQ: ${e}`);
      }

      response.status(200).send("Incoming message handled");
    },
  );
}

export default registerTwilioWebhooks;
