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

import { setExtras } from "@sentry/node";

import { getDecryptedEdovoToken } from "../../../../auth/getDecryptedToken";
import { getAuthToken } from "../../../../auth/utils";
import { TRPCFastifyRequest } from "../../../../context";
import { jwksVerifier } from "../jwksVerifier";
import { edovoIdTokenPayloadSchema } from "./payload";

/**
 * Looks for a JWE in the request headers and decrypts it if found.
 * If not found it will throw
 */
export async function decryptToken(req: TRPCFastifyRequest) {
  const encryptedToken = getAuthToken(req);

  // only encrypted tokens can be logged because they contain PII.
  // using Sentry "extra data" because the size limits are more permissive than tags.
  // also renaming the property because "encryptedToken" runs afoul of Sentry's data scrubbers
  setExtras({ edovoJWE: encryptedToken });

  // decrypting gets us a signed JWT to pass on to the next middleware
  const decryptedToken = await getDecryptedEdovoToken(encryptedToken);

  return { encryptedToken, decryptedToken };
}

/**
 * Verifies a decrypted token using Edovo's JWKS and returns the validated payload.
 */
export async function verifyToken(token: string) {
  return edovoIdTokenPayloadSchema.parse(
    await jwksVerifier({
      token,
      jwksUri: process.env["EDOVO_JWKS_URL"] ?? "",
      additionalJwksOptions: {
        requestHeaders: {
          "X-Api-Key": process.env["EDOVO_API_KEY"] ?? "",
        },
      },
    }),
  );
}
