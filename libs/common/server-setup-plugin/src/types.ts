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

import type { AnyRouter } from "@trpc/server";
import type { FastifyTRPCPluginOptions } from "@trpc/server/adapters/fastify";
import type { Algorithm } from "fast-jwt";

export type Auth0Config = {
  domain: string;
  audience: string;
};

export type JwtConfig = {
  key: string;
  algorithm?: Algorithm;
  expiresIn?: string;
};

export type AuthConfig = 
  | { auth0Options: Auth0Config; jwtOptions?: never }
  | { auth0Options?: never; jwtOptions: JwtConfig }
  | { auth0Options?: never; jwtOptions?: never };

export type BuildServerOptions<TRouter extends AnyRouter> = {
  appRouter: TRouter;
  createContext: NonNullable<
    FastifyTRPCPluginOptions<TRouter>["trpcOptions"]["createContext"]
  >;
  useWSS?: boolean;
  trpcPrefix?: string;
} & AuthConfig;
