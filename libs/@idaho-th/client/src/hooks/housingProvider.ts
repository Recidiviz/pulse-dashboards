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

import { useQueryClient } from "@tanstack/react-query";
import { useCallback } from "react";

import { useIdahoTHStore } from "../datastores/IdahoTHStoreContext";
import type { HousingProviderOption } from "../interfaces/common";
import { trpc } from "../trpc/client";

/**
 * The caller's organizations and the one the server resolves them to.
 *
 * Deliberately ignores the active-organization header: it runs on a cold load,
 * before the client holds an identifier to assert, and it is the gate's only
 * input. `enabled` is how staff opt out — the procedure is provider-only.
 */
export const useResolveHousingProvider = (enabled: boolean) => {
  return trpc.housingProvider.resolve.useQuery(undefined, { enabled });
};

/** The only write path for the remembered organization. */
export const useSetActiveHousingProvider = () => {
  return trpc.housingProvider.setActive.useMutation();
};

/**
 * Switches the organization the portal is acting as.
 *
 * The ordering below is the whole point of this hook and must not be
 * rearranged. The query client runs with an infinite stale time, so clearing
 * it and resetting the stores *before* the new identifier takes effect is what
 * stops the previous organization's rows being re-served under the new
 * organization's name. Persisting the choice comes last; it is a preference
 * write, not a precondition for acting as the organization.
 *
 * Picking the organization already in effect only closes the picker: nothing
 * changed, so its cached data stays.
 */
export const useSwitchHousingProvider = () => {
  const queryClient = useQueryClient();
  const store = useIdahoTHStore();
  const setActive = useSetActiveHousingProvider();

  return useCallback(
    (housingProvider: HousingProviderOption) => {
      if (housingProvider.id === store.housingProviderStore.activeProviderId) {
        store.housingProviderStore.closeHousingProviderSelection();
        return;
      }
      queryClient.clear();
      store.reset();
      store.housingProviderStore.setActiveHousingProvider(housingProvider);
      setActive.mutate({ providerId: housingProvider.id });
    },
    [queryClient, setActive, store],
  );
};
