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

import { type Prisma } from "~@idaho-th/prisma/client";
import { ELIGIBLE_PROVIDER_STAFF_SELECT } from "~@idaho-th/trpc/routes/housing-common/eligibleProvider.selects";

export const STAFF_OWNED_APPLICATION_SELECT = {
  id: true,
  applicationId: true,
  stage: true,
  paroleCommissionDecision: true,
  application: {
    select: {
      expectedReleaseDate: true,
      formData: true,
      homePlan: { select: { releaseDecision: true } },
    },
  },
} as const satisfies Prisma.StaffHousingApplicationSelect;

export const PAROLE_COMMISSION_DECISION_APPLICATION_SELECT = {
  formData: true,
  staffApplication: { select: { stage: true, paroleCommissionDecision: true } },
  homePlan: {
    select: { selectedProviderId: true, homePlanInvestigation: true },
  },
  providerApplications: {
    select: { id: true, providerId: true, stage: true, subStage: true },
  },
} as const satisfies Prisma.HousingApplicationSelect;

export const HOUSING_APPLICATION_CREATE_INCLUDE = {
  staffApplication: true,
  eligibleProviders: {
    select: ELIGIBLE_PROVIDER_STAFF_SELECT,
  },
} as const satisfies Prisma.HousingApplicationInclude;

export const HOUSING_APPLICATION_UPDATE_INCLUDE = {
  staffApplication: true,
  eligibleProviders: {
    select: ELIGIBLE_PROVIDER_STAFF_SELECT,
  },
} as const satisfies Prisma.HousingApplicationInclude;
