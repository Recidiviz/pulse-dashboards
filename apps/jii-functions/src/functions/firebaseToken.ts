// Recidiviz - a data platform for criminal justice reform
// Copyright (C) 2024 Recidiviz, Inc.
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
import { defineString } from "firebase-functions/params";
import { onRequest } from "firebase-functions/v2/https";
import jwks from "jwks-rsa";

import { getAuth0Config, metadataNamespace, metadataSchema } from "~auth0-jii";

import {
  firebaseAdminSecrets,
  getFirebaseToken,
} from "../helpers/firebaseAdmin";
import { useRateLimiter } from "../helpers/ratelimit";

const tenantKey = defineString("AUTH0_TENANT_KEY");

const app = express();

useRateLimiter(app);

const jwtMiddleware = (
  request: Request,
  response: Response,
  next: NextFunction,
): void => {
  // param should be read during the function runtime, not globally
  const auth0Config = getAuth0Config(tenantKey.value());

  const handler = jwt({
    secret: jwks.expressJwtSecret({
      cache: true,
      rateLimit: true,
      jwksRequestsPerMinute: 5,
      jwksUri: `https://${auth0Config.domain}/.well-known/jwks.json`,
    }),
    audience: auth0Config.audience,
    issuer: `https://${auth0Config.domain}/`,
    algorithms: ["RS256"],
  });

  handler(request, response, next);
};
app.use(jwtMiddleware);

app.get("/", async (request, response): Promise<void> => {
  const { user } = request;

  // middleware should have taken care of this for us
  if (!user) {
    response.status(500).send({ message: "Missing expected user credentials" });
    return;
  }

  try {
    // @ts-expect-error sub comes from the Auth0 token
    const uid: string = user.sub;

    const metadata = metadataSchema.parse(
      // @ts-expect-error metadata comes from the Auth0 token
      user[`${metadataNamespace}/app_metadata`],
    );

    const firebaseToken = await getFirebaseToken(uid, metadata);

    response.json({ firebaseToken });
  } catch (err) {
    response.status(500).send({
      message: "Something went wrong acquiring a Firebase token.",
      error: err,
    });
  }
});

export const firebaseToken = onRequest(
  {
    cors: true,
    secrets: [...firebaseAdminSecrets],
  },
  app,
);
