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

import { getPrismaClientForStateCode } from "~@sentencing/prisma";
import { verifyAuth0Token } from "~server-setup-plugin";

// HTTP headers are flattened to lowercase in Fastify
const STATE_CODE_HEADER_KEY = "statecode";
const APP_METADATA_KEY =
  "https://dashboard.recidiviz.org/app_metadata" as const;

type Auth0User = {
  [APP_METADATA_KEY]: {
    stateCode: string;
    allowedStates?: string[];
    pseudonymizedId?: string;
    // Raw Auth0 route entries, e.g. { psi_sarAccess: true } -- only the
    // trailing "_" segment is the route key. Mirrors UserStore.routes.
    routes?: Record<string, boolean>;
  };
};

// True if the caller has been granted the SAR product in Auth0 -- distinct
// from resolving to a Staff row, which only means they were imported via
// OMS/roster sync. Mirrors the frontend's UserStore.routes/userAllowedNavigation.
export function resolveHasSARRouteAccess(
  routes: Record<string, boolean> | undefined,
) {
  if (!routes) return false;
  return Object.entries(routes).some(
    ([key, isAllowed]) => isAllowed && key.split("_").pop() === "sarAccess",
  );
}

export async function createContext(opts: CreateFastifyContextOptions) {
  const { req, res } = opts;
  const stateCode = req.headers[STATE_CODE_HEADER_KEY];

  if (!stateCode || typeof stateCode !== "string") {
    throw new TRPCError({
      code: "PRECONDITION_FAILED",
      message: `Unsupported state code provided in request headers: ${stateCode}`,
    });
  }

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

  const authPayload = await verifyAuth0Token(opts);

  let staffPseudonymizedId: string | undefined;
  let hasSARRouteAccess = false;

  if (authPayload) {
    const auth0User = authPayload as Auth0User;
    const userStateLower = auth0User[APP_METADATA_KEY]?.stateCode;
    const userState = userStateLower?.toUpperCase();
    const isRecidivizUser = userState === "RECIDIVIZ";

    if (!isRecidivizUser && userState !== stateCode) {
      throw new TRPCError({
        code: "FORBIDDEN",
        message: `User with state code ${userState} cannot request data about state: ${stateCode}`,
      });
    }

    // Read pseudonymizedId directly from the JWT app_metadata claim.
    // Recidiviz internal users are excluded — their pseudonymizedId is not in
    // client-state Staff tables, so applying ownership checks would block them from
    // everything. They retain unrestricted access via the state-code check above.
    if (!isRecidivizUser) {
      staffPseudonymizedId = auth0User[APP_METADATA_KEY]?.pseudonymizedId;
    }

    hasSARRouteAccess = resolveHasSARRouteAccess(
      auth0User[APP_METADATA_KEY]?.routes,
    );
  }

  return {
    req,
    res,
    isAuthorized: !!authPayload,
    prisma: prismaClient,
    staffPseudonymizedId,
    hasSARRouteAccess,
  };
}
