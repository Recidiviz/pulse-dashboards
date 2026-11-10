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

import type { Prisma } from "~@idaho-th/prisma/client";

import {
  HOUSING_PROVIDER_CONTACT_SELECT,
  type HousingProviderContact,
  toHousingProviderContact,
} from "./housingProviderContact";
import { PROVIDER_LOCATION_STAFF_SELECT } from "./providerLocation.selects";

// :TODO will move these into providerLocation.selects
export const ELIGIBLE_PROVIDER_STAFF_SELECT = {
  id: true,
  applicationId: true,
  providerId: true,
  providerLocationId: true,
  isSelected: true,
  // The organization only. Its people live on HousingProviderUser now, and the
  // email/contactName/contactPhone columns are gone from this table.
  provider: {
    select: {
      id: true,
      name: true,
    },
  },
  providerLocation: {
    select: PROVIDER_LOCATION_STAFF_SELECT,
  },
  // eligibilityOverrideNote is intentionally excluded — it is internal-only staff data
} as const satisfies Prisma.EligibleHousingProviderSelect;

/**
 * {@link ELIGIBLE_PROVIDER_STAFF_SELECT} plus the organization's contact, for
 * the staff matching screens that show a person to call. Kept separate so the
 * create/update paths that reuse the base select do not start returning a join
 * they never render.
 */
export const ELIGIBLE_PROVIDER_WITH_CONTACT_SELECT = {
  ...ELIGIBLE_PROVIDER_STAFF_SELECT,
  provider: {
    select: {
      id: true,
      name: true,
      ...HOUSING_PROVIDER_CONTACT_SELECT,
    },
  },
} as const satisfies Prisma.EligibleHousingProviderSelect;

type EligibleProviderWithContactRow = Prisma.EligibleHousingProviderGetPayload<{
  select: typeof ELIGIBLE_PROVIDER_WITH_CONTACT_SELECT;
}>;

export type EligibleProviderWithContactView = Omit<
  EligibleProviderWithContactRow,
  "provider"
> & {
  provider: {
    id: string;
    name: string;
    contact: HousingProviderContact | null;
  };
};

/** Flattens the contact join so the client never sees assignment rows. */
export function toEligibleProviderWithContact(
  row: EligibleProviderWithContactRow,
): EligibleProviderWithContactView {
  const { provider, ...rest } = row;
  return {
    ...rest,
    provider: {
      id: provider.id,
      name: provider.name,
      contact: toHousingProviderContact(provider),
    },
  };
}
