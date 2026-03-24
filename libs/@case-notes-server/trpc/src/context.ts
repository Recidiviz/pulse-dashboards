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

// Required to get the "request.jwtVerify" decorator to be recongized by typescript
import "@fastify/jwt";

import { TRPCError } from "@trpc/server";
import type { CreateFastifyContextOptions } from "@trpc/server/adapters/fastify";

import { verifyAuth0Token } from "~server-setup-plugin";

// HTTP headers are flattened to lowercase in Fastify
const STATE_CODE_HEADER_KEY = "statecode";
const APP_METADATA_KEY =
  "https://dashboard.recidiviz.org/app_metadata" as const;

type Auth0User = {
  [APP_METADATA_KEY]: {
    stateCode: string;
    allowedStates?: string[];
  };
};

// Idaho data is stored under US_IX in vertex + the exact match table, so we need to correct the state code
function correctStateCode(stateCode: string) {
  if (stateCode === "US_ID") {
    return "US_IX";
  }

  return stateCode;
}

export async function createContext(opts: CreateFastifyContextOptions) {
  const { req } = opts;
  const stateCode = req.headers[STATE_CODE_HEADER_KEY];

  if (!stateCode || typeof stateCode !== "string") {
    throw new TRPCError({
      code: "PRECONDITION_FAILED",
      message: `Unsupported state code provided in request headers: ${stateCode}`,
    });
  }

  const correctedStateCode = correctStateCode(stateCode);

  const authPayload = await verifyAuth0Token(opts);

  if (authPayload) {
    const auth0User = authPayload as Auth0User;
    const userStateLower = auth0User[APP_METADATA_KEY]?.stateCode;
    const userState = userStateLower?.toUpperCase();
    const isRecidivizUser = userState === "RECIDIVIZ";

    // Compare against the raw stateCode header, not the BigQuery-corrected version
    if (!isRecidivizUser && userState !== stateCode) {
      throw new TRPCError({
        code: "FORBIDDEN",
        message: `User with state code ${userState} cannot request data about state: ${stateCode}`,
      });
    }
  }

  return {
    ...opts,
    stateCode: correctedStateCode,
    isAuthorized: !!authPayload,
  };
}
