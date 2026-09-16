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

import { FastifyReply, FastifyRequest } from "fastify";

export type StateCode = "US_TN";

export type Auth0User = {
  [`https://dashboard.recidiviz.org/app_metadata`]: {
    stateCode: "recidiviz" | StateCode;
    allowedStates?: string[];
    featureVariants?: Record<string, unknown>;
  };
  "https://dashboard.recidiviz.org/email_address": string | undefined;
};

export type FeatureVariant = "TEST";
export type FeatureVariantRecord = Partial<Record<FeatureVariant, boolean>>;

export type AuthUser = {
  email: string;
  isRecidivizUser: boolean;
  featureVariants: FeatureVariantRecord;
};

export type Context = {
  req: FastifyRequest;
  res: FastifyReply;
  isAuth0Authorized: boolean;
  user?: AuthUser;
};
