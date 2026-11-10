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

import { type Prisma, ThreadType } from "~@idaho-th/prisma/client";
import { HOUSING_PROVIDER_CONTACT_SELECT } from "~@idaho-th/trpc/routes/housing-common/housingProviderContact";
import { PROVIDER_LOCATION_CORE_SELECT } from "~@idaho-th/trpc/routes/housing-common/providerLocation.selects";
import { INFO_REQUEST_WITH_MESSAGES_SELECT } from "~@idaho-th/trpc/routes/infoRequest/infoRequest.selects";

import { buildProviderApplicationWhere } from "./applicationProviders.filters";
import type { ProviderApplicationFilters } from "./applicationProviders.types";

export const PROVIDER_LOCATION_SELECT = {
  id: true,
  providerId: true,
  housingType: true,
  populationsServed: true,
  addressUsedForPPInvestigation: true,
  ...PROVIDER_LOCATION_CORE_SELECT,
} as const;

const STAFF_PROVIDER_THREAD_TYPES: ThreadType[] = [
  ThreadType.INFO_REQUEST,
  ThreadType.CONDITIONAL_APPROVAL_REVOKED,
];

export const PROVIDER_APPLICATION_SELECT = {
  id: true,
  providerId: true,
  stage: true,
  subStage: true,
  status: true,
  createdAt: true,
  // The organization, plus the one user staff are shown as its contact — see
  // ORGANIZATION_CONTACT_SELECT. The email/contactPhone/contactName columns no
  // longer exist on this table; its people are HousingProviderUser rows now.
  provider: {
    select: {
      name: true,
      ...HOUSING_PROVIDER_CONTACT_SELECT,
    },
  },
  providerLocation: {
    select: PROVIDER_LOCATION_SELECT,
  },
  // Prisma allows one select per relation, so info requests and revoke notes
  // come back together, newest first, and the mapper splits them by type.
  threads: {
    where: { type: { in: STAFF_PROVIDER_THREAD_TYPES } },
    select: { ...INFO_REQUEST_WITH_MESSAGES_SELECT, type: true },
    orderBy: { createdAt: "desc" as const },
  },
} as const;

export function staffApplicationProvidersSelect(
  filters?: ProviderApplicationFilters,
) {
  return {
    id: true,
    staffApplication: {
      select: { staffPseudonymizedId: true },
    },
    providerApplications: {
      where: buildProviderApplicationWhere(filters),
      select: PROVIDER_APPLICATION_SELECT,
    },
  } satisfies Prisma.HousingApplicationSelect;
}
