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

import {
  authorizedUserProfileSchema,
  getAuth0Config,
  metadataNamespace,
} from "~@jii/auth";

import { getFirebaseToken } from "../../../auth/getFirebaseToken";
import { getAuthToken, jwtSchema } from "../../../auth/utils";
import { baseProcedure } from "../../../procedures/init";
import { jwksVerifier } from "./jwksVerifier";

const auth0Config = getAuth0Config(process.env["AUTH0_TENANT_KEY"] ?? "");

// there is a one-off token for this endpoint only,
// so it's not really worth involving the common server plugin.
// all of the verification config just lives with this route
export const auth0ToFirebaseToken = baseProcedure.query(
  async ({ ctx: { req } }) => {
    const payload = jwtSchema.parse(
      await jwksVerifier({
        jwksUri: `https://${auth0Config.domain}/.well-known/jwks.json`,
        token: getAuthToken(req),
        additionalVerifierOptions: {
          allowedAud: auth0Config.audience,
          allowedIss: `https://${auth0Config.domain}/`,
        },
      }),
    );

    const uid = payload.sub;

    const userProfile = authorizedUserProfileSchema.parse(
      payload[`${metadataNamespace}/app_metadata`],
    );

    const firebaseToken = await getFirebaseToken(uid, userProfile);

    return { firebaseToken };
  },
);
