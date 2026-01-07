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

import { TRPCError } from "@trpc/server";
import type { CreateFastifyContextOptions } from "@trpc/server/adapters/fastify";
import { z } from "zod";

import { AuthorizedUserProfile, authorizedUserProfileSchema } from "~@jii/auth";
import { getPrismaClientForStateCode } from "~@jii/prisma";
import { verifyFirebaseIdToken } from "~server-setup-plugin";

// HTTP headers are flattened to lowercase in Fastify
const STATE_CODE_HEADER_KEY = "statecode";
const DEMO_DATA_HEADER_KEY = "usedemodata";

// only contains the standard JWT claims we care about
const jwtSchema = z.object({ sub: z.string() });

function validateHeaders(opts: CreateFastifyContextOptions) {
  const stateCode = opts.req.headers[STATE_CODE_HEADER_KEY];

  if (!stateCode || typeof stateCode !== "string") {
    throw new TRPCError({
      code: "PRECONDITION_FAILED",
      message: `Unsupported state code provided in request headers: ${stateCode}`,
    });
  }
  const isDemoRequest = opts.req.headers[DEMO_DATA_HEADER_KEY] === "true";
  return { stateCode, isDemoRequest };
}

async function validateAuthPayload(
  stateCode: string,
  isDemoRequest: boolean,
  opts: CreateFastifyContextOptions,
) {
  const authPayload = await verifyFirebaseIdToken(opts);

  if (authPayload["app"] !== "jii") {
    throw new TRPCError({
      code: "UNAUTHORIZED",
      message: "You are not authorized to access this application",
    });
  }

  const userId = jwtSchema.parse(authPayload).sub;

  const userProfile = authorizedUserProfileSchema.parse(authPayload);

  // special permissions for Recidiviz users
  if (userProfile.stateCode === "RECIDIVIZ" && isDemoRequest) {
    // no state permissions check in this case, Recidiviz users can access all demo data
  }
  // everyone else, or Recidiviz users outside of demo mode
  else if (
    userProfile.stateCode !== stateCode &&
    !userProfile.allowedStates?.includes(stateCode)
  ) {
    throw new TRPCError({
      code: "UNAUTHORIZED",
      message: "You are not authorized to access this state",
    });
  }

  return { userId, userProfile };
}

function getDatabaseConnection(
  stateCode: string,
  isDemoRequest: boolean,
  permissions: AuthorizedUserProfile["permissions"],
) {
  let prismaClient;

  // clients can explicitly request demo data,
  // or we may limit them to demo data only based on their permissions
  const useDemoDb = isDemoRequest || !permissions?.includes("live_data");

  try {
    prismaClient = getPrismaClientForStateCode(
      `${stateCode}${useDemoDb ? "_DEMO" : ""}`,
    );
  } catch (e) {
    throw new TRPCError({
      code: "PRECONDITION_FAILED",
      message: `Unsupported state code provided in request headers: ${stateCode}${useDemoDb ? " (DEMO)" : ""}`,
      cause: e,
    });
  }

  return prismaClient;
}

export async function createContext(opts: CreateFastifyContextOptions) {
  const { stateCode, isDemoRequest } = validateHeaders(opts);

  const { userId, userProfile } = await validateAuthPayload(
    stateCode,
    isDemoRequest,
    opts,
  );

  const prisma = getDatabaseConnection(
    stateCode,
    isDemoRequest,
    userProfile.permissions,
  );

  return {
    userId,
    userProfile,
    stateCode,
    prisma,
  };
}

export type Context = Awaited<ReturnType<typeof createContext>>;
