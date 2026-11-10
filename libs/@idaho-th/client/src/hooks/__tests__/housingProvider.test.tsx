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

import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { act, renderHook } from "@testing-library/react";
import type { ReactNode } from "react";
import { beforeEach, describe, expect, it, vi } from "vitest";

import { USER_ROLE } from "~@idaho-th/shared";

import type { IdahoTHStore } from "../../datastores/IdahoTHStore";
import { buildIdahoTHStore, StoreWrapper } from "../../test/renderWithStore";
import {
  useResolveHousingProvider,
  useSwitchHousingProvider,
} from "../housingProvider";

const recorded = vi.hoisted(() => ({
  resolveOptions: undefined as Record<string, unknown> | undefined,
  setActive: vi.fn(),
}));

vi.mock("../../trpc/client", () => ({
  trpc: {
    housingProvider: {
      resolve: {
        useQuery: (_input: unknown, options: Record<string, unknown>) => {
          recorded.resolveOptions = options;
          return { data: undefined, isPending: true };
        },
      },
      setActive: {
        useMutation: () => ({ mutate: recorded.setActive }),
      },
    },
  },
}));

const ORG_A = { id: "housing-provider-a", name: "Sunrise House" };
const ORG_B = { id: "housing-provider-b", name: "Lakeside Home" };

let queryClient: QueryClient;
let store: IdahoTHStore;

function wrapper({ children }: { children: ReactNode }) {
  return (
    <QueryClientProvider client={queryClient}>
      <StoreWrapper store={store}>{children}</StoreWrapper>
    </QueryClientProvider>
  );
}

beforeEach(() => {
  queryClient = new QueryClient({
    defaultOptions: { queries: { staleTime: Infinity, retry: false } },
  });
  store = buildIdahoTHStore({ role: USER_ROLE.PROVIDER });
  recorded.resolveOptions = undefined;
  recorded.setActive.mockClear();
});

describe("useResolveHousingProvider", () => {
  it("runs for a provider and stays disabled for anyone else", () => {
    renderHook(() => useResolveHousingProvider(true), { wrapper });
    expect(recorded.resolveOptions).toMatchObject({ enabled: true });

    renderHook(() => useResolveHousingProvider(false), { wrapper });
    expect(recorded.resolveOptions).toMatchObject({ enabled: false });
  });
});

describe("useSwitchHousingProvider", () => {
  /**
   * The ordering assertion this ticket turns on. The query client runs with an
   * infinite stale time, so anything still cached when the new identifier
   * takes effect is re-served under the new organization's name.
   */
  it("clears the cache and resets the stores before the new identifier takes effect", () => {
    store.housingProviderStore.setActiveHousingProvider(ORG_A);
    store.housingApplicationsStore.setCurrentApplicationId("application-a");
    queryClient.setQueryData(["applications"], ["resident at Sunrise House"]);

    const stateAtClear: Array<{
      activeProviderId: string | null;
      currentApplicationId: string | undefined;
    }> = [];
    const clearForReal = queryClient.clear.bind(queryClient);
    vi.spyOn(queryClient, "clear").mockImplementation(() => {
      stateAtClear.push({
        activeProviderId: store.housingProviderStore.activeProviderId,
        currentApplicationId:
          store.housingApplicationsStore.currentApplicationId,
      });
      clearForReal();
    });

    const { result } = renderHook(() => useSwitchHousingProvider(), {
      wrapper,
    });
    act(() => result.current(ORG_B));

    // The cache was emptied while the portal was still acting as the previous
    // organization, and before anything belonging to it had been dropped.
    expect(stateAtClear).toEqual([
      { activeProviderId: ORG_A.id, currentApplicationId: "application-a" },
    ]);
    expect(queryClient.getQueryCache().getAll()).toHaveLength(0);

    // The stores were reset, and the new identifier survived that reset — which
    // it could not have done had it been set first.
    expect(store.housingApplicationsStore.currentApplicationId).toBeUndefined();
    expect(store.housingProviderStore.activeProviderId).toBe(ORG_B.id);
  });

  it("only closes the picker when the provider already in effect is chosen", () => {
    store.housingProviderStore.setActiveHousingProvider(ORG_A);
    store.housingApplicationsStore.setCurrentApplicationId("application-a");
    queryClient.setQueryData(["applications"], ["resident at Sunrise House"]);
    store.housingProviderStore.openHousingProviderSelection();

    const { result } = renderHook(() => useSwitchHousingProvider(), {
      wrapper,
    });
    act(() => result.current(ORG_A));

    expect(store.housingProviderStore.mustSelectHousingProvider).toBe(false);
    expect(store.housingProviderStore.activeProviderId).toBe(ORG_A.id);
    expect(store.housingApplicationsStore.currentApplicationId).toBe(
      "application-a",
    );
    expect(queryClient.getQueryCache().getAll()).toHaveLength(1);
    expect(recorded.setActive).not.toHaveBeenCalled();
  });

  it("persists the choice through the one mutation that writes it", () => {
    const { result } = renderHook(() => useSwitchHousingProvider(), {
      wrapper,
    });
    act(() => result.current(ORG_B));

    expect(recorded.setActive).toHaveBeenCalledWith({
      providerId: ORG_B.id,
    });
  });

  it("lifts the forced selection raised by a revoked assignment", () => {
    store.housingProviderStore.requireHousingProviderSelection();

    const { result } = renderHook(() => useSwitchHousingProvider(), {
      wrapper,
    });
    act(() => result.current(ORG_A));

    expect(store.housingProviderStore.mustSelectHousingProvider).toBe(false);
    expect(store.housingProviderStore.activeProviderId).toBe(ORG_A.id);
  });
});
