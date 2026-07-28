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

import {
  checkDemoResidentsRoster,
  checkResidentsRoster,
  getRecidivizUserProfile,
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
    userId: z.string(),
    stateCode: z.string().toUpperCase(),
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
      reply
        .status(401)
        .send({ error: "Your credentials contain invalid identity data" });
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
      const userProfile = await checkResidentsRoster(
        userData.stateCode,
        userData.userId,
      );
      if (userProfile) {
        reply.status(200).send({ userProfile });
        return;
      }

      // fallback: if not a real user, check if they're a demo user
      const demoUserProfile = await checkDemoResidentsRoster(
        userData.stateCode,
        userData.userId,
      );
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
