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
import rateLimit from "express-rate-limit";
import firebaseAdmin from "firebase-admin";
import { App } from "firebase-admin/app";
import { defineSecret, defineString } from "firebase-functions/params";
import { onRequest } from "firebase-functions/v2/https";
import jwks from "jwks-rsa";
import toUpper from "lodash/toUpper";

import { getAuth0Config, metadataNamespace, metadataSchema } from "~auth0-jii";

const tenantKey = defineString("AUTH0_TENANT_KEY");
// Firestore is running in a different Firebase project than these functions
const dataSourceProject = defineString("DATA_SOURCE_FIREBASE_PROJECT");
// this is the service account key we will use to authenticate
const dataSourceCredential = defineSecret("DATA_SOURCE_FIREBASE_CREDENTIAL");
// the full credential exceeds the secrets character limit,
// which is why the private key field is stored separately (it is by far the largest value)
const dataSourceCredentialPrivateKey = defineSecret(
  "DATA_SOURCE_FIREBASE_CREDENTIAL_PRIVATE_KEY",
);

const app = express();

// matches the params set for the staff server, as a reasonable baseline
const limiter = rateLimit({
  windowMs: 1000, // 1 second = 1000ms
  max: 15, // each IP address gets 15 requests per 1 second
  standardHeaders: true, // return rate limit info in the `RateLimit-*` headers
  legacyHeaders: false, // disabling the `X-RateLimit-*` headers
});
app.use(limiter);

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

// there can only be one firebase app instance, but we have to access the credentials within the function;
// therefore we will cache it here the first time it's accessed
let firebaseApp: App;

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

    const stateCode = metadata.stateCode;
    const externalId = metadata.externalId;
    const recidivizAllowedStates = (metadata.allowedStates ?? []).map(toUpper);
    const permissions = metadata.permissions ?? [];

    const firebaseCredential = {
      ...JSON.parse(dataSourceCredential.value()),
      // this string may contain newlines, which we need to render as \n codes for valid JSON
      private_key: dataSourceCredentialPrivateKey
        .value()
        .replace(/\\n/gm, "\n"),
    };

    firebaseApp =
      firebaseApp ??
      firebaseAdmin.initializeApp({
        projectId: dataSourceProject.value(),
        credential: firebaseAdmin.credential.cert(firebaseCredential),
      });

    const firebaseToken = await firebaseAdmin
      .auth(firebaseApp)
      .createCustomToken(uid, {
        app: "jii",
        stateCode,
        externalId,
        recidivizAllowedStates,
        permissions,
      });

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
    secrets: [dataSourceCredential, dataSourceCredentialPrivateKey],
  },
  app,
);
