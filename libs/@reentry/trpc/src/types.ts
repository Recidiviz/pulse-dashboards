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

import { FastifyReply, FastifyRequest } from "fastify";

import { PrismaClient, StateCode } from "~@reentry/prisma/client";

export type AuthUser = {
  clientPseudoId: string;
  iat?: number;
  exp?: number;
};

export type Context = {
  req: FastifyRequest;
  res: FastifyReply;
  isRegularJwtAuthorized: boolean;
  isAuth0Authorized: boolean;
  user: AuthUser | null;
  prisma: PrismaClient;
  stateCode: StateCode;
};
