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

import "@fastify/jwt";

import type { CreateFastifyContextOptions } from "@trpc/server/adapters/fastify";
import * as jwt from "jsonwebtoken";

import { AuthUser } from "~@reentry/trpc/types";

// Put types that need to be exported to other apps here
export { createContext } from "~@reentry/trpc/context";
export type { AppRouter } from "~@reentry/trpc/router";
export { appRouter } from "~@reentry/trpc/router";

export async function authenticateAndGetUser(
  opts: CreateFastifyContextOptions,
): Promise<AuthUser | null> {
  const { req, info } = opts;

  let token =
    info.connectionParams?.["authorization"] ?? req.headers.authorization;
  let user = null;

  token = token?.replace(/^Bearer\s+/, "");

  try {
    if (info.connectionParams) {
      // Websocket connection
      if (!token) throw new Error("No token provided in WebSocket connection");
      const JWT_SECRET = process.env["INTAKE_PRIVATE_JWT_KEY"] ?? "";
      user = jwt.verify(token, JWT_SECRET) as AuthUser;
    } else {
      // HTTP connection
      if (!req.headers.authorization)
        throw new Error("No token provided in HTTP request");
      await req.jwtVerify();
      user = req.user as AuthUser;
    }
  } catch (err) {
    console.error("There was an issue verifying the JWT token:", err);
  }

  return user;
}
