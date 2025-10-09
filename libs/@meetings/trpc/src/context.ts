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
import { StateCode } from "~@meetings/prisma/client";
import { AuthUser, Context } from "~@meetings/trpc/types";
import { verifyAuth0Token } from "~server-setup-plugin";

type Auth0User = {
  "https://dashboard.recidiviz.org/app_metadata": {
    pseudonymizedId: string;
  };
};

// HTTP headers are flattened to lowercase in Fastify
const STATE_CODE_HEADER_KEY = "statecode";

function formatUser(user: Auth0User | undefined): AuthUser | undefined {
  if (!user) {
    return undefined;
  }

  return {
    pseudonymizedId:
      user["https://dashboard.recidiviz.org/app_metadata"].pseudonymizedId,
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

  if (
    !stateCode ||
    typeof stateCode !== "string" ||
    !Object.values(StateCode).includes(stateCode as StateCode)
  ) {
    throw new TRPCError({
      code: "PRECONDITION_FAILED",
      message: `Unsupported state code provided in request headers: ${stateCode}`,
    });
  }

  // Cast since the returned object from verifyAuth0Token has no type information
  const auth0User = (await verifyAuth0Token(opts)) as Auth0User;
  const formattedUser = formatUser(auth0User);

  let prismaClient;
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
