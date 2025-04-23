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
import { FastifyReply, FastifyRequest } from "fastify";
import { OAuth2Client } from "google-auth-library";
import { validateRequest } from "twilio/lib/webhooks/webhooks";

import { TwilioWebhookRequest } from "~@jii-texting/server/server/types";
import { isValidStateCode } from "~@jii-texting/server/server/utils";

export async function verifyGoogleIdToken(
  authorizationHeaders: string | undefined,
  email: string,
) {
  const idToken = authorizationHeaders?.split(" ")[1];

  if (!idToken) {
    throw new Error("No bearer token was provided");
  }

  const oAuth2Client = new OAuth2Client();

  const result = await oAuth2Client.verifyIdToken({
    idToken,
  });

  const payload = result.getPayload();

  if (!payload || !payload.email_verified || !payload.email) {
    throw new Error("Email not verified");
  }

  if (payload.email !== email) {
    throw new Error("Invalid email address");
  }

  console.log(`Email verified: ${payload.email}`);
}

/**
 * Authenticates requests to the JII Texting Server by validating that the
 * Auth token is associated with the expected email;
 * @param email The service account email authorized to make requests to the endpoint
 */
export function getAuthenticateInternalRequestPreHandlerFn<
  T extends FastifyRequest,
>(email: string) {
  return async (request: T, reply: FastifyReply) => {
    if (request.params && Object.hasOwn(request.params, "stateCode")) {
      // Validate the state code in the URL
      const { stateCode: stateCodeStr } = request.params as {
        stateCode: string;
      };

      if (!isValidStateCode(stateCodeStr)) {
        reply.status(400).send({ error: "Invalid state code" });
        captureException(`Invalid state code received: ${stateCodeStr}`);
        return;
      }
    }
    // Validate that the token in the request is from the expected service account
    try {
      await verifyGoogleIdToken(request.headers.authorization, email);
    } catch (err) {
      reply.status(403).send({ error: "Invalid token" });
      captureException(`error verifying auth token: ${err}`);
      return;
    }
  };
}

/**
 * Returns the full raw URL of the request
 *
 * @param request The given request object
 * @returns a string representing the full raw URL of a request
 */
function getFullUrl(request: FastifyRequest): string {
  const protocol = request.headers["x-forwarded-proto"] || "http";
  const host = request.headers.host;
  return `${protocol}://${host}${request.raw.url}`;
}

/**
 * Authenticates requests to the Twilio webhooks on the JII Texting Server by validating
 * that the request with the Twilio library validateRequest method
 * @param token The expected Twilio Auth token
 */
export function getAuthenticateTwilioWebhookRequestFn(twilioAuthToken: string) {
  return async (request: TwilioWebhookRequest, response: FastifyReply) => {
    try {
      const twilioSignature = request.headers["x-twilio-signature"];

      if (!twilioSignature) {
        captureException(`No Twilio signature provided`);
        response.status(403).send({ error: `Missing Twilio signature` });
        return;
      }

      const body = request.body as unknown as Record<string, string>;

      // Validate the Twilio request with the Twilio library
      const isValidTwilioRequest = validateRequest(
        twilioAuthToken,
        twilioSignature as string,
        getFullUrl(request),
        body,
      );

      if (!isValidTwilioRequest) {
        captureException(`invalid request received`);
        response.status(403).send({ error: `Invalid Twilio request` });
        return;
      }
    } catch (err) {
      captureException(`error trying to validate webhook request: ${err}`);
      response.status(403).send({ error: `Unable to validate request` });
      return;
    }
  };
}
