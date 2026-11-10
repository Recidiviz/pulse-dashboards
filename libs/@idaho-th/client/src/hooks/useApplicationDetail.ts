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

import { USER_ROLE, UserRole } from "~@idaho-th/shared";
import type { AppRouter } from "~@idaho-th/trpc-types";

import type { HousingApplicationForm } from "../components/HousingApplicationForm/types";
import {
  useHousingApplicationsStore,
  useUserStore,
} from "../datastores/IdahoTHStoreContext";
import { trpc } from "../trpc/client";

type ProvidersFilters = NonNullable<
  inferRouterInputs<AppRouter>["housingApplication"]["getStaffApplicationProviders"]["filters"]
>;

const DETAIL_STALE_TIME_MS = 0;

export function useStaffApplicationById(
  applicationId: string | undefined,
  enabled: boolean,
) {
  return trpc.housingApplication.getStaffApplicationById.useQuery(
    { applicationId: applicationId ?? "" },
    {
      enabled: enabled && !!applicationId,
      staleTime: DETAIL_STALE_TIME_MS,
    },
  );
}

export function useProviderApplicationById(
  applicationId: string | undefined,
  enabled: boolean,
) {
  return trpc.housingApplication.getProviderApplicationById.useQuery(
    { applicationId: applicationId ?? "" },
    {
      enabled: enabled && !!applicationId,
      staleTime: DETAIL_STALE_TIME_MS,
    },
  );
}

export function useDismissProviderAlert(applicationId: string | undefined) {
  const utils = trpc.useUtils();
  return trpc.housingApplication.dismissProviderAlert.useMutation({
    onSuccess: (_, { alertId }) => {
      // Hide the banner now, without waiting on a refetch.
      utils.housingApplication.getProviderApplicationById.setData(
        { applicationId: applicationId ?? "" },
        (old) =>
          old
            ? {
                ...old,
                alerts: old.alerts.filter((alert) => alert.id !== alertId),
              }
            : old,
      );
      // The dashboard reads the same alerts, so its marker must clear too.
      void utils.housingApplication.getProviderApplications.invalidate();
    },
  });
}

export function useDismissStaffAlert(applicationId: string | undefined) {
  const utils = trpc.useUtils();
  return trpc.housingApplication.dismissStaffAlert.useMutation({
    onSuccess: () =>
      void utils.housingApplication.getStaffApplicationById.invalidate({
        applicationId,
      }),
  });
}

export function useStaffApplicationProviders(
  applicationId: string | undefined,
  enabled: boolean,
  filters?: ProvidersFilters,
) {
  return trpc.housingApplication.getStaffApplicationProviders.useQuery(
    { applicationId: applicationId ?? "", filters },
    {
      enabled: enabled && !!applicationId,
      staleTime: DETAIL_STALE_TIME_MS,
    },
  );
}

export function useApplicationDetailByRole(
  applicationId: string | undefined,
  role: UserRole,
) {
  const isStaff = role === USER_ROLE.STAFF;
  const { data: staffData } = useStaffApplicationById(applicationId, isStaff);
  const { data: providerData } = useProviderApplicationById(
    applicationId,
    !isStaff,
  );
  return isStaff ? staffData : providerData;
}

/**
 * Returns the full application-detail record for the currently open
 * application (staff or provider copy, whichever the current role reads),
 * or undefined if none is loaded yet. `formData` is narrowed to
 * `HousingApplicationForm`; every other field (including the read-only,
 * server-resolved `preferredProviders: { id, name }[]` sibling — always
 * current, even after a provider renames) is passed through as-is. It's up
 * to each consumer to destructure whatever fields it needs.
 */
export function useCurrentApplicationDetail() {
  const { currentApplicationId } = useHousingApplicationsStore();
  const userStore = useUserStore();
  const role = userStore.user?.role;

  const data = useApplicationDetailByRole(
    currentApplicationId,
    role ?? USER_ROLE.STAFF,
  );

  if (!data) return undefined;
  return { ...data, formData: data.formData as HousingApplicationForm };
}
