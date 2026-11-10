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

import type { inferRouterInputs } from "@trpc/server";

import type { AppRouter } from "~@idaho-th/trpc-types";

import type { ProviderDetails } from "../hooks/housingApplication";

type ProviderPortalInputs = inferRouterInputs<AppRouter>["housingApplication"];

type ProviderDetailsQueryUtils = {
  cancel: () => Promise<void>;
  getData: () => ProviderDetails | undefined;
  setData: (
    updater:
      | ProviderDetails
      | undefined
      | ((old: ProviderDetails | undefined) => ProviderDetails | undefined),
  ) => void;
};

export type HousingProviderUpdateInput =
  ProviderPortalInputs["updateHousingProvider"];

// The editor closes on Save, so the rollback is the only thing that corrects
// the read view after a failed write.
export function createOptimisticHousingProviderUpdate(
  queryUtils: ProviderDetailsQueryUtils,
) {
  return {
    onMutate: async (variables: HousingProviderUpdateInput) => {
      await queryUtils.cancel();
      const previous = queryUtils.getData();

      queryUtils.setData((old) =>
        old
          ? { ...old, housingProviderName: variables.housingProviderName }
          : old,
      );

      return { previous };
    },
    onError: (
      _error: unknown,
      _variables: HousingProviderUpdateInput,
      context: { previous: ProviderDetails | undefined } | undefined,
    ) => {
      if (context) queryUtils.setData(context.previous);
    },
  };
}

export type ProfileUpdateInput = ProviderPortalInputs["updateProviderProfile"];

/**
 * The person's own fields. The name is required, so it is written straight
 * through; only the nullable phone can be emptied.
 */
export function createOptimisticProfileUpdate(
  queryUtils: ProviderDetailsQueryUtils,
) {
  return {
    onMutate: async (variables: ProfileUpdateInput) => {
      await queryUtils.cancel();
      const previous = queryUtils.getData();

      queryUtils.setData((old) => {
        if (!old) return old;
        return {
          ...old,
          contactName:
            variables.contactName !== undefined
              ? variables.contactName
              : old.contactName,
          contactPhone:
            variables.contactPhone !== undefined
              ? variables.contactPhone || null
              : old.contactPhone,
        };
      });

      return { previous };
    },
    onError: (
      _error: unknown,
      _variables: ProfileUpdateInput,
      context: { previous: ProviderDetails | undefined } | undefined,
    ) => {
      if (context) queryUtils.setData(context.previous);
    },
  };
}

export type LocationUpdateInput =
  ProviderPortalInputs["updateProviderLocation"];

export function createOptimisticLocationUpdate(
  queryUtils: ProviderDetailsQueryUtils,
) {
  return {
    onMutate: async (variables: LocationUpdateInput) => {
      await queryUtils.cancel();
      const previous = queryUtils.getData();

      queryUtils.setData((old) => {
        if (!old) return old;
        return {
          ...old,
          locations: old.locations.map((location) =>
            location.id === variables.locationId
              ? {
                  ...location,
                  ...(variables.streetAddress !== undefined && {
                    streetAddress: variables.streetAddress,
                  }),
                  ...(variables.city !== undefined && { city: variables.city }),
                  ...(variables.state !== undefined && {
                    state: variables.state,
                  }),
                  ...(variables.zip !== undefined && { zip: variables.zip }),
                  ...(variables.district !== undefined && {
                    district: variables.district,
                  }),
                  ...(variables.acceptedGender !== undefined && {
                    acceptedGenders: [variables.acceptedGender],
                  }),
                  ...(variables.acceptsRiders !== undefined && {
                    acceptsRiders: variables.acceptsRiders,
                  }),
                  ...(variables.acceptsSexOffenders !== undefined && {
                    acceptsSexOffenders: variables.acceptsSexOffenders,
                  }),
                  ...(variables.acceptsViolentCriminals !== undefined && {
                    acceptsViolentCriminals: variables.acceptsViolentCriminals,
                  }),
                  ...(variables.faithBased !== undefined && {
                    faithBased: variables.faithBased,
                  }),
                }
              : location,
          ),
        };
      });

      return { previous };
    },
    onError: (
      _error: unknown,
      _variables: LocationUpdateInput,
      context: { previous: ProviderDetails | undefined } | undefined,
    ) => {
      if (context) queryUtils.setData(context.previous);
    },
  };
}
