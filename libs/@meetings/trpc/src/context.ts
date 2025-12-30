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

// Required to get the "request.jwtVerify" decorator to be recognized by typescript
import "@fastify/jwt";

import { TRPCError } from "@trpc/server";
import type { CreateFastifyContextOptions } from "@trpc/server/adapters/fastify";

import { getPrismaClientForStateCode } from "~@meetings/prisma";
import { PrismaClient, StateCode } from "~@meetings/prisma/client";
import env from "~@meetings/trpc/env";
import { AuthUser, Context } from "~@meetings/trpc/types";
import { verifyAuth0Token } from "~server-setup-plugin";

export type Auth0User = {
  "https://dashboard.recidiviz.org/app_metadata": {
    stateCode: "recidiviz" | StateCode;
    pseudonymizedId?: string;
    allowedStates?: string[];
  };
};

// HTTP headers are flattened to lowercase in Fastify
const STATE_CODE_HEADER_KEY = "statecode";
const SKIP_AUTH_HEADER_KEY = "x-skip-auth";

function formatAndVerifyUser(
  user: Auth0User | undefined,
  requestedState: string,
): AuthUser | undefined {
  if (!user) {
    return undefined;
  }

  // Grab the fields we want from the metadata since there is more in there than just these
  const {
    stateCode: userState,
    pseudonymizedId,
    allowedStates,
  } = user["https://dashboard.recidiviz.org/app_metadata"];

  // Check non-Recidiviz users first
  if (userState !== "recidiviz") {
    if (!Object.values(StateCode).includes(userState as StateCode)) {
      throw new TRPCError({
        code: "PRECONDITION_FAILED",
        message: `Unsupported state code provided in auth0 app_metadata: ${userState}`,
      });
    }
    if (userState !== requestedState) {
      throw new TRPCError({
        code: "FORBIDDEN",
        message: `User with state code ${userState} cannot request data about state: ${requestedState}`,
      });
    }
    if (!pseudonymizedId) {
      throw new TRPCError({
        code: "PRECONDITION_FAILED",
        message: `Missing pseudonymizedId for user`,
      });
    }
  } else {
    if (!allowedStates?.includes(requestedState)) {
      throw new TRPCError({
        code: "FORBIDDEN",
        message: `Recidiviz user cannot request data about state: ${requestedState}. File a go/access request for access`,
      });
    }
  }

  return {
    // we checked missing pseudonymized id above for non-Recidiviz users, so if it's missing here then they are recidiviz
    pseudonymizedId: pseudonymizedId ?? "RECIDIVIZ",
  };
}

export async function createContext(
  opts: CreateFastifyContextOptions,
): Promise<Context> {
  const { req, res, info } = opts;
  let stateCode: string | string[] | undefined;

  if (info.connectionParams) {
    stateCode = info.connectionParams[STATE_CODE_HEADER_KEY];
  } else {
    stateCode = req.headers[STATE_CODE_HEADER_KEY];
  }

  // Early return for requests without stateCode (public routes)
  if (!stateCode) {
    return {
      req,
      res,
      isAuth0Authorized: false,
      user: undefined,
      prisma: undefined,
      stateCode: undefined,
    };
  }

  // Validate stateCode format
  if (
    typeof stateCode !== "string" ||
    !Object.values(StateCode).includes(stateCode as StateCode)
  ) {
    throw new TRPCError({
      code: "PRECONDITION_FAILED",
      message: `Unsupported state code provided in request headers: ${stateCode}`,
    });
  }

  // Check for skip auth in offline mode (dev only)
  const skipAuthHeader = req.headers[SKIP_AUTH_HEADER_KEY];
  const isDevMode = env.NODE_ENV === "development";
  const shouldSkipAuth = skipAuthHeader === "true";
  if (shouldSkipAuth && !isDevMode) {
    throw new TRPCError({
      code: "UNAUTHORIZED",
      message: "Auth can only be skipped on a server running in dev mode",
    });
  }

  // Perform authentication
  let formattedUser: AuthUser | undefined;
  if (shouldSkipAuth) {
    // In dev mode with skip auth, create a mock user
    console.log("Skipping Auth0 verification in dev mode - using mock user");
    formattedUser = {
      pseudonymizedId: "staff-pid-1",
    };
  } else {
    // Cast since the returned object from verifyAuth0Token has no type information
    const auth0User = (await verifyAuth0Token(opts)) as Auth0User | undefined;
    formattedUser = formatAndVerifyUser(auth0User, stateCode);
  }

  console.log(`formattedUser: ${JSON.stringify(formattedUser)}`);

  // Connect to database
  let prismaClient: PrismaClient;
  try {
    prismaClient = getPrismaClientForStateCode(stateCode);
  } catch (e) {
    throw new TRPCError({
      code: "PRECONDITION_FAILED",
      message: `Unsupported state code provided in request headers: ${stateCode}`,
      cause: e,
    });
  }

  return {
    req,
    res,
    isAuth0Authorized: !!formattedUser,
    user: formattedUser,
    prisma: prismaClient,
    stateCode: stateCode as StateCode,
  };
}
