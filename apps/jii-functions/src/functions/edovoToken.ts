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

import express, { NextFunction, Request, Response } from "express";
import jwt from "express-jwt";
import { defineSecret } from "firebase-functions/params";
import { onRequest } from "firebase-functions/v2/https";
import jwks from "jwks-rsa";
import { z } from "zod";

import { UserAppMetadata } from "~auth0-jii";

import {
  firebaseAdminSecrets,
  getFirebaseToken,
  lookupResident,
} from "../helpers/firebaseAdmin";
import { useRateLimiter } from "../helpers/ratelimit";

// this one is properly a secret, it's a private key
const EDOVO_API_KEY = defineSecret("EDOVO_API_KEY");
// these are less sensitive but they do represent third-party resources
// that we would rather not have checked into code
const EDOVO_JWKS_URL = defineSecret("EDOVO_JWKS_URL");
const EDOVO_TOKEN_ISSUER = defineSecret("EDOVO_TOKEN_ISSUER");

const app = express();

useRateLimiter(app);

const edovoPayloadSchema = z
  .object({ USER_ID: z.string(), STATE: z.string().toUpperCase() })
  .transform((user) => {
    // known cases where our ID formats do not match
    if (user.STATE === "ME") {
      return { ...user, USER_ID: user.USER_ID.replace(/^0+/, "") };
    }
    return user;
  });

// JWT middleware
app.use((request: Request, response: Response, next: NextFunction) => {
  const handler = jwt({
    secret: jwks.expressJwtSecret({
      cache: true,
      rateLimit: true,
      jwksRequestsPerMinute: 5,
      jwksUri: EDOVO_JWKS_URL.value(),
      requestHeaders: {
        "X-Api-Key": EDOVO_API_KEY.value(),
      },
    }),
    issuer: EDOVO_TOKEN_ISSUER.value(),
    algorithms: ["RS256"],
  });

  handler(request, response, next);
});

// there is only one route in this app, but Firebase rewrite rules may affect what it is.
// using a wildcard route means we don't have to keep it manually in sync with the config
app.get("/*", async (request, response): Promise<void> => {
  const user = edovoPayloadSchema.safeParse(request.user);

  if (!user.success) {
    response.status(400).json({ error: user.error });
    return;
  }

  const userData = user.data;

  const stateCode = `US_${userData.STATE}`;
  const userResidentRecord = await lookupResident(stateCode, userData.USER_ID);

  // existing user records serve as the roster for this product
  // TODO: add tenant and/or feature gating
  // TODO: handle internal or admin users?
  const pseudonymizedId = userResidentRecord?.["pseudonymizedId"];

  if (typeof pseudonymizedId === "string") {
    const userMetadata: UserAppMetadata = {
      stateCode,
      externalId: userData.USER_ID,
      pseudonymizedId,
      permissions: ["live_data"],
    };

    const firebaseToken = await getFirebaseToken(
      `${stateCode}_${userData.USER_ID}`,
      userMetadata,
    );

    response.json({ firebaseToken, user: userMetadata });
  } else {
    response
      .status(403)
      .json({ error: "You are not authorized to access this application" });
  }
});

// additional error handling
app.use(
  // if we don't define the fourth arg, express won't recognize this as an error handler.
  // we don't need to use it because we are terminating all requests here
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  (error: Error, request: Request, response: Response, next: NextFunction) => {
    // this is what the JWT middleware throws
    if (error.name === "UnauthorizedError") {
      // we might want to clean up this message eventually
      // but forwarding the original will help with testing
      response.status(401).json({ error });
    } else {
      response.status(500).json({ error });
    }
  },
);

export const edovoToken = onRequest(
  {
    cors: true,
    secrets: [
      EDOVO_API_KEY,
      EDOVO_JWKS_URL,
      EDOVO_TOKEN_ISSUER,
      ...firebaseAdminSecrets,
    ],
  },
  app,
);
