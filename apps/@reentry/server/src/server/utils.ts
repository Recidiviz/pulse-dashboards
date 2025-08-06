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

import { BaseMessage } from "@langchain/core/messages";
import { captureException } from "@sentry/node";
import type { FastifyReply, FastifyRequest } from "fastify";
import { OAuth2Client } from "google-auth-library";

import { getIntakeCheckpointerForStateCode } from "~@reentry/intake-agent/get-checkpointer";
import { StateCode } from "~@reentry/prisma/client";
import { RequestWithStateCodeParams } from "~@reentry/server/server/types";

export async function verifyGoogleIdToken(
  authorizationHeaders: string | undefined,
  email: string,
) {
  const idToken = authorizationHeaders?.replace(/^Bearer\s+/, "");

  if (!idToken) {
    throw new Error("No bearer token was provided");
  }

  const oAuth2Client = new OAuth2Client();

  const result = await oAuth2Client.verifyIdToken({
    idToken,
  });

  const payload = result.getPayload();

  // Optionally, if "includeEmail" was set in the token options, check if the
  // email was verified
  if (!payload || !payload.email_verified || !payload.email) {
    throw new Error("Email not verified");
  }

  if (payload.email !== email) {
    throw new Error("Invalid email address");
  }
}

export function isValidStateCode(stateCode: string) {
  return (Object.values(StateCode) as string[]).includes(stateCode);
}

/**
 * Authenticates requests to the Reentry Server by validating that the
 * Auth token is associated with the expected email;
 * @param email The service account email authorized to make requests to the endpoint
 */
export function getAuthenticateInternalRequestPreHandlerFn<
  T extends FastifyRequest<{
    Params: RequestWithStateCodeParams;
  }>,
>(email: string) {
  return async (request: T, reply: FastifyReply) => {
    if (request.params && Object.hasOwn(request.params, "stateCode")) {
      // Validate the state code in the URL
      const { stateCode } = request.params;

      if (!isValidStateCode(stateCode)) {
        reply.status(400).send({ error: "Invalid state code" });
        captureException(`Invalid state code received: ${stateCode}`);
        return;
      }
    }
    // Validate that the token in the request is from the expected service account
    try {
      await verifyGoogleIdToken(request.headers.authorization, email);
    } catch (err) {
      reply.status(401).send({ error: "Invalid token" });
      captureException(`error verifying auth token: ${err}`);
      return;
    }
  };
}

export async function getChatHistoryForClient(
  intakeId: string,
  stateCode: string,
): Promise<BaseMessage[] | undefined> {
  const checkpointer = getIntakeCheckpointerForStateCode(stateCode);

  const result = await checkpointer.get({
    configurable: {
      thread_id: intakeId,
    },
  });

  return result?.channel_values["messages"] as BaseMessage[] | undefined;
}
