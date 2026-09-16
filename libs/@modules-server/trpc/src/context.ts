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

import type { CreateFastifyContextOptions } from "@trpc/server/adapters/fastify";

import { verifyAuth0Token } from "~server-setup-plugin";

import type { Auth0User, AuthUser, Context } from "./types";

function formatAndVerifyUser(user: Auth0User): AuthUser | undefined {
  const { stateCode: userStateLower } =
    user["https://dashboard.recidiviz.org/app_metadata"];
  const email = user["https://dashboard.recidiviz.org/email_address"];
  const userState = userStateLower.toUpperCase();
  const isRecidivizUser = userState === "RECIDIVIZ";

  if (!email) return;

  return {
    email,
    isRecidivizUser,
    featureVariants: {},
  };
}

export async function createContext(
  opts: CreateFastifyContextOptions,
): Promise<Context> {
  const { req, res } = opts;

  const auth0User = (await verifyAuth0Token(opts)) as Auth0User | undefined;

  if (!auth0User)
    return {
      req,
      res,
      isAuth0Authorized: false,
    };

  const authUser = formatAndVerifyUser(auth0User);

  if (!authUser)
    return {
      req,
      res,
      isAuth0Authorized: false,
    };

  return { req, res, isAuth0Authorized: true, user: authUser };
}
