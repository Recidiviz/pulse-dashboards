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

import { renderHook } from "@testing-library/react";
import { makeAutoObservable } from "mobx";
import type { ReactNode } from "react";
import { describe, expect, it, vi } from "vitest";

import { IdahoTHStore, type RootStore } from "../IdahoTHStore";
import {
  IdahoTHStoreContext,
  useHousingApplicationsStore,
  useIdahoTHStore,
  usePreviewModalStore,
  useUserStore,
} from "../IdahoTHStoreContext";

class HostUserStore {
  isAuthorized = true;

  userIsLoading = false;

  constructor() {
    makeAutoObservable(this);
  }

  authorize = vi.fn();

  loginWithRedirect = vi.fn();

  loginWithEmail = vi.fn();
}

function buildStore(): IdahoTHStore {
  return new IdahoTHStore({
    userStore: new HostUserStore(),
  } as unknown as RootStore);
}

function withProvider(store: IdahoTHStore) {
  return function Wrapper({ children }: { children: ReactNode }) {
    return (
      <IdahoTHStoreContext.Provider value={store}>
        {children}
      </IdahoTHStoreContext.Provider>
    );
  };
}

const MISSING_PROVIDER = "useIdahoTHStore must be used within a StoreProvider";

describe("IdahoTHStore context hooks", () => {
  it.each([
    ["useIdahoTHStore", useIdahoTHStore],
    ["useHousingApplicationsStore", useHousingApplicationsStore],
    ["usePreviewModalStore", usePreviewModalStore],
    ["useUserStore", useUserStore],
  ])("%s throws outside a provider", (_name, hook) => {
    // Failing loudly beats returning undefined and surfacing later as an
    // unrelated "cannot read property of undefined".
    expect(() => renderHook(() => hook())).toThrow(MISSING_PROVIDER);
  });

  it("useIdahoTHStore returns the provided store", () => {
    const store = buildStore();

    const { result } = renderHook(() => useIdahoTHStore(), {
      wrapper: withProvider(store),
    });

    expect(result.current).toBe(store);
  });

  it("useHousingApplicationsStore returns that store's applications sub-store", () => {
    const store = buildStore();

    const { result } = renderHook(() => useHousingApplicationsStore(), {
      wrapper: withProvider(store),
    });

    expect(result.current).toBe(store.housingApplicationsStore);
  });

  it("usePreviewModalStore returns that store's preview-modal sub-store", () => {
    const store = buildStore();

    const { result } = renderHook(() => usePreviewModalStore(), {
      wrapper: withProvider(store),
    });

    expect(result.current).toBe(store.previewModalStore);
  });

  it("useUserStore reaches through to the host app's user store", () => {
    const store = buildStore();

    const { result } = renderHook(() => useUserStore(), {
      wrapper: withProvider(store),
    });

    expect(result.current).toBe(store.rootStore.userStore);
  });
});
