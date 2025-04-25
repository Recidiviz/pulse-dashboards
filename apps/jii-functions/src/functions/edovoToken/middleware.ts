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

import { setUser } from "@sentry/node";
import { createPrivateKey } from "crypto";
import { NextFunction, Request, Response } from "express";
import jwt from "express-jwt";
import { compactDecrypt } from "jose";
import jwks from "jwks-rsa";

import { secrets } from "../../helpers/secrets";

/**
 * Extracts a bearer auth token from Express request headers,
 * throwing if one cannot be found.
 */
function getRequestToken(request: Request) {
  const header = request.get("authorization");
  if (!header) throw new Error("Missing authorization header");

  const token = /^Bearer (.+)$/.exec(header)?.[1];
  if (!token) {
    throw new Error(
      `Bearer authorization is required. Invalid header: ${header}`,
    );
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
  try {
    const encryptedToken = getRequestToken(request);

    // only encrypted tokens can be logged because they contain PII
    setUser({ id: encryptedToken });

    // decrypting gets us a signed JWT to pass on to the next middleware
    const { plaintext: decryptedToken } = await compactDecrypt(
      encryptedToken,
      createPrivateKey(await secrets.getLatestValue("EDOVO_TOKEN_PRIVATE_KEY")),
    );

    // updating this header in place because that's where the JWT middleware will look
    request.headers.authorization = `Bearer ${decryptedToken}`;
    next();
  } catch (e) {
    next(`${e}`);
  }
}

/**
 * Express middleware that will verify a JWT signed by Edovo,
 * using their public key as retrieved from an API endpoint.
 * Will throw if the JWT is missing or invalid.
 */
export async function verifyToken(
  request: Request,
  response: Response,
  next: NextFunction,
) {
  try {
    const handler = jwt({
      secret: jwks.expressJwtSecret({
        cache: true,
        rateLimit: true,
        jwksRequestsPerMinute: 5,
        jwksUri: await secrets.getLatestValue("EDOVO_JWKS_URL"),
        requestHeaders: {
          "X-Api-Key": await secrets.getLatestValue("EDOVO_API_KEY"),
        },
      }),
      algorithms: ["RS256"],
    });

    handler(request, response, next);
  } catch (e) {
    next(`${e}`);
  }
}
