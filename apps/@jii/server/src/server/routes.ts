// Recidiviz - a data platform for criminal justice reform
// Copyright (C) 2026 Recidiviz, Inc.
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

import { createVerifier } from "fast-jwt";
import { FastifyInstance, FastifyRequest } from "fastify";
import { z } from "zod";

import { stateCodes } from "~@jii/configs";
import {
  checkDemoResidentsRoster,
  checkResidentsRoster,
  getRecidivizUserProfile,
  RosterLookupOpts,
} from "~@jii/trpc";

import { checkAdminPanelPermissions } from "./staffUsers";

// this is the payload of a short-lived JWT that Auth0 Actions sign with a Google
// service account private key when calling this endpoint during login/registration
const auth0UserPayloadSchema = z.discriminatedUnion("userType", [
  // Recidiviz user
  z.object({ userType: z.literal("RECIDIVIZ"), email: z.string() }),
  // Orijin users
  z.object({
    userType: z.literal("ORIJIN"),
    stateCode: z.string().toUpperCase(),
    // for backwards compatibility we are supporting two ID schemes;
    // this is the old (deprecated) one
    userId: z.string().optional(),
    // and this (two fields) is the new one
    userExternalId: z.string().optional(),
    userUniqueId: z.string().optional(),
  }),
  // State employee
  z.object({ userType: z.literal("STATE"), email: z.string() }),
]);

function getBearerToken(request: FastifyRequest): string | undefined {
  return request.headers.authorization?.replace("Bearer ", "");
}

export function registerAuthRoutes(server: FastifyInstance) {
  const publicKey = process.env["AUTH0_PUBLIC_KEY"]?.replace(/\\n/g, "\n");
  if (!publicKey) {
    throw new Error("Missing required AUTH0_PUBLIC_KEY configuration");
  }

  const verifyToken = createVerifier({
    key: async () => publicKey,
    algorithms: ["RS256"],
  });

  const PAYLOAD_SCHEMA_ERROR = "Your credentials contain invalid identity data";

  server.get("/api/v1/auth0-roster-check", async (request, reply) => {
    const token = getBearerToken(request);
    if (!token) {
      reply.status(401).send({ error: "Your credentials are invalid" });
      return;
    }

    let payload: unknown;
    try {
      payload = await verifyToken(token);
    } catch {
      reply.status(401).send({ error: "Your credentials are invalid" });
      return;
    }

    const parseResult = auth0UserPayloadSchema.safeParse(payload);
    if (!parseResult.success) {
      reply.status(401).send({ error: PAYLOAD_SCHEMA_ERROR });
      return;
    }
    const userData = parseResult.data;

    if (userData.userType === "RECIDIVIZ") {
      // assumed to be a valid user email, though this will throw if it isn't
      const userProfile = await getRecidivizUserProfile(userData.email);
      reply.status(200).send({ userProfile });
      return;
    }

    if (userData.userType === "ORIJIN") {
      const stateCode = stateCodes.safeParse(userData.stateCode).data;

      if (!stateCode) {
        reply
          .status(401)
          .send({ error: `Invalid state code: ${userData.stateCode}` });
        return;
      }

      let rosterLookupArgs: RosterLookupOpts;

      if (userData.userId) {
        rosterLookupArgs = {
          stateCode,
          userExternalId: userData.userId,
          // this is a magic string for compatibility; the updated lookup function
          // requires both IDs but this one is not available under the old endpoint request schema
          userIdFromAuthProvider: "__NO_ID_PROVIDED__",
        };
      } else if (userData.userExternalId && userData.userUniqueId) {
        rosterLookupArgs = {
          stateCode,
          userExternalId: userData.userExternalId,
          userIdFromAuthProvider: userData.userUniqueId,
        };
      } else {
        reply
          .status(401)
          // this isn't literally a schema parsing error because of the backwards compatibility support;
          // once the old field is eliminated from the schema we can make the new fields required and delete this branch
          .send({ error: PAYLOAD_SCHEMA_ERROR });
        return;
      }

      const userProfile = await checkResidentsRoster(rosterLookupArgs);
      if (userProfile) {
        reply.status(200).send({ userProfile });
        return;
      }

      // fallback: if not a real user, check if they're a demo user
      const demoUserProfile = await checkDemoResidentsRoster(rosterLookupArgs);
      if (demoUserProfile) {
        reply.status(200).send({ userProfile: demoUserProfile });
        return;
      }
    }

    if (userData.userType === "STATE") {
      const userProfile = await checkAdminPanelPermissions(userData.email);
      if (userProfile) {
        reply.status(200).send({ userProfile });
        return;
      }
    }

    reply.status(404).send({ error: "User not found" });
  });
}
