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
import type { i18n } from "i18next";

import { getPrismaClientForStateCode } from "~@jii-texting/prisma";
import { getAuthenticateTwilioWebhookRequestFn } from "~@jii-texting/server/server/authUtils";
import { TwilioWebhookRequest } from "~@jii-texting/server/server/types";
import {
  isOptOut,
  setPreferredLanguage,
} from "~@jii-texting/server/server/utils";
import { BQ_DATASET_ID, BQ_REPLIES_VIEW_ID } from "~@jii-texting/utils";
import { i18nInstance, initI18n } from "~@jii-texting/utils/common/i18n";
import { getTwilioClientForStateCode } from "~twilio-api";

/**
 * Makes a request to the Twilio client to send a confirmation text message
 * @param stateCode The state code which indicates which Twilio messaging service to use
 * @param phoneNumber The phone number to send the confirmation text to
 * @param preferredLanguage The preferred language indicated by the jii in the text response (en or es)
 */
export async function sendLanguageConfirmation(
  stateCode: string,
  phoneNumber: string,
  preferredLanguage: string,
  i18n: i18n,
) {
  const twilioClient = getTwilioClientForStateCode(stateCode);

  let confirmationBody = "";
  confirmationBody += i18n.t("languagePreferenceConfirmationMessage", {
    lng: preferredLanguage,
  });

  try {
    await twilioClient.createMessage(confirmationBody, phoneNumber);
  } catch (error) {
    console.log(
      `There was a twilio client error when attempting to send the confirmation text: ${error}`,
    );
    captureException(
      `There was a twilio client error when attempting to send the confirmation text: ${error}`,
    );
    return;
  }

  console.log(`Sent a language preference confirmation text.`);
  return;
}

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

      console.log(`Incoming messaged received by webhook for ${stateCode}`);

      const {
        OptOutType: optOutType,
        From: fromNumber,
        To,
        MessageSid,
        Body,
        MessagingServiceSid,
        AccountSid,
      } = request.body;

      // Remove the international code prefix, i.e. +1, for internal use
      const fromPhoneNumber = fromNumber.substring(2);

      try {
        const bigQueryClient = new BigQuery({
          projectId: process.env["DATA_PLATFORM_PROJECT_ID"],
        });

        await bigQueryClient
          .dataset(BQ_DATASET_ID)
          .table(BQ_REPLIES_VIEW_ID)
          .insert({
            to: To.substring(2),
            from: fromPhoneNumber,
            message_sid: MessageSid,
            body: Body,
            opt_out_type: optOutType,
            account_sid: AccountSid,
            messaging_service_sid: MessagingServiceSid,
            time_received: new Date().toISOString(),
            state_code: stateCode,
          });

        console.log("Logged incoming message to BigQuery");
      } catch (e) {
        captureException(`Failed to write incoming message to BQ: ${e}`);
      }

      try {
        // Find the people that have this phone number, if they exist
        const people = await prisma.person.findMany({
          where: {
            phoneNumber: fromPhoneNumber,
          },
        });

        if (!people) {
          console.log(
            `Received incoming message from phone number without associated Person`,
          );
          return response.status(200).send();
        }

        // If the person exists and the person has opted out, update their record
        if (optOutType) {
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

          console.log(`Updated opt-out for people: ${updatedPseudoIds}`);
          console.log("Incoming opt-out message handled");
          return response.status(200).send();
        }

        // Instantiate i18Next
        await initI18n();
        const preferredLanguage = setPreferredLanguage(Body, i18nInstance);
        if (preferredLanguage && stateCode.toUpperCase() === "US_TX") {
          await prisma.person.updateMany({
            where: {
              phoneNumber: fromPhoneNumber,
            },
            data: {
              preferredLanguage: preferredLanguage,
            },
          });

          const updatedPseudoIds = people.map((person) => {
            return person.pseudonymizedId;
          });

          console.log(
            `Updated language preference for people: ${updatedPseudoIds}`,
          );

          await sendLanguageConfirmation(
            stateCode,
            fromPhoneNumber,
            preferredLanguage,
            i18nInstance,
          );
        }
      } catch (e) {
        captureException(
          `Failed while trying to find person in DB with the incoming phone number. Check Twilio logs to see if the incoming message was an opt-out message. Error: ${e}`,
        );
      }

      console.log("Incoming message handled");
      return response.status(200).send();
    },
  );
}

export default registerTwilioWebhooks;
