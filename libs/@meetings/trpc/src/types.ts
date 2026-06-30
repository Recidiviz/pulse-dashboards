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

import { PrismaClient, StateCode } from "~@meetings/prisma/client";

export type FeatureVariantValue = {
  activeDate?: string; // string because JSON dates from Auth0
  variant?: string;
  activeTenants?: StateCode[];
};

export type FeatureVariant = "TEST" | "feedbackTab";

export type FeatureVariantRecord = Partial<
  Record<FeatureVariant, FeatureVariantValue>
>;

export type AuthUser = {
  email: string;
  isRecidivizUser: boolean;
  allowedStates?: string[];
  impersonatedBy?: string;
  featureVariants?: FeatureVariantRecord;
};

export type Context = {
  req: FastifyRequest;
  res: FastifyReply;
  isAuth0Authorized: boolean;
  isSkipAuth: boolean;
  user?: AuthUser;
  prisma?: PrismaClient;
  stateCode?: StateCode;
  impersonatedEmail?: string;
};
