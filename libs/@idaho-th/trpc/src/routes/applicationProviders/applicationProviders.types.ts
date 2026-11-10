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

import type { z } from "zod";

import type { Prisma } from "~@idaho-th/prisma/client";
import type { HousingProviderContact } from "~@idaho-th/trpc/routes/housing-common/housingProviderContact";
import type { InfoRequestWithMessages } from "~@idaho-th/trpc/routes/infoRequest/infoRequest.types";

import type { providerApplicationFiltersShape } from "./applicationProviders.filters";
import type { getStaffApplicationProvidersSchema } from "./applicationProviders.schema";
import {
  PROVIDER_APPLICATION_SELECT,
  PROVIDER_LOCATION_SELECT,
  staffApplicationProvidersSelect,
} from "./applicationProviders.selects";

export type ProviderApplicationFilters = z.infer<
  typeof providerApplicationFiltersShape
>;

export type GetStaffApplicationProvidersInput = z.infer<
  typeof getStaffApplicationProvidersSchema
>;

export type ApplicationProviderLocation =
  Prisma.HousingProviderLocationGetPayload<{
    select: typeof PROVIDER_LOCATION_SELECT;
  }>;

export type ProviderApplicationRow =
  Prisma.ProviderHousingApplicationGetPayload<{
    select: typeof PROVIDER_APPLICATION_SELECT;
  }>;

export type StaffApplicationProvidersRow = Prisma.HousingApplicationGetPayload<{
  select: ReturnType<typeof staffApplicationProvidersSelect>;
}>;

export type ApplicationProvider = {
  providerApplicationId: string;
  providerId: string;
  providerName: string;
  /** Display only — see toOrganizationContact. Null when nobody is assigned. */
  contact: HousingProviderContact | null;
  stage: ProviderApplicationRow["stage"];
  subStage: ProviderApplicationRow["subStage"];
  status: ProviderApplicationRow["status"];
  /** When the application was sent to this provider. */
  createdAt: ProviderApplicationRow["createdAt"];
  providerLocation: ApplicationProviderLocation;
  infoRequests: InfoRequestWithMessages[];
  /** The provider's reason from their latest revoke, if they ever revoked. */
  approvalRevoked: { message: string; createdAt: Date } | null;
};

export type GetApplicationProvidersResult = {
  applicationId: string;
  providers: ApplicationProvider[];
};
