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

import { render, type RenderOptions } from "@testing-library/react";
import { makeAutoObservable } from "mobx";
import type { ReactElement, ReactNode } from "react";
import { vi } from "vitest";

import { USER_ROLE, type UserRole } from "~@idaho-th/shared";

import { IdahoTHStore, type RootStore } from "../datastores/IdahoTHStore";
import { IdahoTHStoreContext } from "../datastores/IdahoTHStoreContext";

/**
 * The host app's userStore, as a class instance rather than a plain object.
 *
 * `IdahoTHStore` annotates `rootStore` as `observable.deep`, and MobX *copies*
 * a plain object into a new observable while leaving a class instance alone. A
 * plain-object double would therefore stop reflecting mutations made through
 * this fixture, and role-change assertions would pass for the wrong reason.
 */
class HostUserStore {
  isAuthorized = true;

  userIsLoading = false;

  user?: {
    role?: UserRole;
    providerPseudonymizedId?: string;
    nickname?: string;
  };

  constructor(user?: HostUserStore["user"]) {
    if (user) this.user = user;
    makeAutoObservable(this);
  }

  getToken = vi.fn(async () => "test-token");

  authorize = vi.fn();

  loginWithRedirect = vi.fn();

  loginWithEmail = vi.fn();

  logout = vi.fn();
}

class HostRootStore {
  userStore: HostUserStore;

  constructor(user?: HostUserStore["user"]) {
    this.userStore = new HostUserStore(user);
    makeAutoObservable(this);
  }
}

export type StoreOverrides = {
  /** Seeds `housingApplicationsStore.currentApplicationId`. */
  currentApplicationId?: string;
  role?: UserRole;
  providerPseudonymizedId?: string;
};

export function buildIdahoTHStore({
  currentApplicationId,
  role = USER_ROLE.STAFF,
  providerPseudonymizedId,
}: StoreOverrides = {}): IdahoTHStore {
  const root = new HostRootStore({
    role,
    ...(providerPseudonymizedId ? { providerPseudonymizedId } : {}),
  });
  const store = new IdahoTHStore(root as unknown as RootStore);
  if (currentApplicationId) {
    store.housingApplicationsStore.setCurrentApplicationId(
      currentApplicationId,
    );
  }
  return store;
}

export function StoreWrapper({
  store,
  children,
}: {
  store: IdahoTHStore;
  children: ReactNode;
}) {
  return (
    <IdahoTHStoreContext.Provider value={store}>
      {children}
    </IdahoTHStoreContext.Provider>
  );
}

/** Renders `ui` inside a real `IdahoTHStore`, and hands the store back. */
export function renderWithStore(
  ui: ReactElement,
  {
    store = buildIdahoTHStore(),
    ...options
  }: Omit<RenderOptions, "wrapper"> & { store?: IdahoTHStore } = {},
) {
  return {
    store,
    ...render(ui, {
      wrapper: ({ children }) => (
        <StoreWrapper store={store}>{children}</StoreWrapper>
      ),
      ...options,
    }),
  };
}
