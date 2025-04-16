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

import { createPrivateKey } from "crypto";
import { NextFunction, Request, Response } from "express";
import jwt from "express-jwt";
import { error as logError, info as logInfo } from "firebase-functions/logger";
import { compactDecrypt } from "jose";
import jwks from "jwks-rsa";

import {
  EDOVO_API_KEY,
  EDOVO_JWKS_URL,
  EDOVO_TOKEN_ISSUER,
  EDOVO_TOKEN_PRIVATE_KEY,
} from "./secrets";

/**
 * Extracts a bearer auth token from Express request headers,
 * throwing if one cannot be found.
 */
function getRequestToken(request: Request) {
  const header = request.get("authorization");
  if (!header) throw new Error("Missing authorization header");

  const token = /^Bearer (.+)$/.exec(header)?.[1];
  if (!token) {
    logError("Invalid Authorization header:", header);
    throw new Error("Bearer authorization is required");
  }
  return token;
}

/**
 * Express middleware that looks for a JWE in the request headers;
 * if found it will be replaced with a decrypted JWT. If not found it will throw
 */
export async function decryptToken(
  request: Request,
  response: Response,
  next: NextFunction,
) {
  const encryptedToken = getRequestToken(request);
  // only encrypted tokens can be logged because they contain PII
  logInfo("Encrypted ID token:", encryptedToken);

  // decrypting gets us a signed JWT to pass on to the next middleware
  const { plaintext: decryptedToken } = await compactDecrypt(
    encryptedToken,
    createPrivateKey(EDOVO_TOKEN_PRIVATE_KEY.value()),
  );

  // updating this header in place because that's where the JWT middleware will look
  request.headers.authorization = `Bearer ${decryptedToken}`;
  next();
}

/**
 * Express middleware that will verify a JWT signed by Edovo,
 * using their public key as retrieved from an API endpoint.
 * Will throw if the JWT is missing or invalid.
 */
export function verifyToken(
  request: Request,
  response: Response,
  next: NextFunction,
) {
  // we have to create this inside the middleware function in order to access secrets
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
    // different edovo environments we support will have different issuers
    issuer: EDOVO_TOKEN_ISSUER.value().split(","),
    algorithms: ["RS256"],
  });

  handler(request, response, next);
}

/**
 * Express middleware that converts thrown errors into JSON responses.
 * Should be applied last (after the endpoint function)
 */
export function errorHandler(
  error: Error,
  request: Request,
  response: Response,
  // if we don't define the fourth arg, express won't recognize this as an error handler.
  // we don't need to use it because we are terminating all requests here
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  next: NextFunction,
) {
  logError(error);
  // this is what the JWT middleware throws
  if (error.name === "UnauthorizedError") {
    // we might want to clean up this message eventually
    // but forwarding the original will help with testing
    response.status(401).json({ error });
  } else {
    response.status(500).json({ error });
  }
}
