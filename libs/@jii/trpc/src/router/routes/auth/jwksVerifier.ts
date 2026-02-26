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

import { createDecoder, createVerifier, VerifierOptions } from "fast-jwt";
import jwks from "jwks-rsa";

const jwtDecoder = createDecoder({ complete: true });

type Opts = {
  jwksUri: string;
  additionalJwksOptions?: Partial<Omit<jwks.Options, "jwksUri">>;
  token: string;
  additionalVerifierOptions?: Partial<VerifierOptions>;
};

/**
 * @param opts
 * @param opts.jwksUri the url where JWKS can be fetched
 * @param opts.additionalJwksOptions this function specifies some generic defaults for caching
 * and rate limiting; if you require overrides or extras, specify them here
 * @param opts.token the signed JWT to verify
 * @param opts.additionalVerifierOptions this function specifies some generic defaults,
 * such as which algorithm to use; if you require overrides or extras such as required claims etc,
 * specify them here
 * @returns the verified token payload
 */
export function jwksVerifier({
  token,
  jwksUri,
  additionalJwksOptions,
  additionalVerifierOptions,
}: Opts) {
  const jwksClient = jwks({
    cache: true,
    rateLimit: true,
    jwksRequestsPerMinute: 5,
    jwksUri,
    ...additionalJwksOptions,
  });

  const {
    header: { kid },
  } = jwtDecoder(token);
  const jwtVerifier = createVerifier({
    key: async () => (await jwksClient.getSigningKey(kid)).getPublicKey(),
    cache: true,
    algorithms: ["RS256"],
    ...additionalVerifierOptions,
  });

  return jwtVerifier(token);
}
