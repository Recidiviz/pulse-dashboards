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

import React, { createContext, useContext } from "react";

import { IdahoTHStoreContext, TrpcProvider } from "~@idaho-th/client";

import { RootStore, rootStore } from "../RootStore";
import { UserStore } from "../UserStore";

const RootStoreContext = createContext<RootStore | undefined>(undefined);

interface StoreProviderProps {
  children: React.ReactNode;
}

/** Bridges the app's RootStore into the lib's Store. */
export const StoreProvider: React.FC<StoreProviderProps> = ({ children }) => {
  return (
    <RootStoreContext.Provider value={rootStore}>
      <IdahoTHStoreContext.Provider value={rootStore.idahoTHStore}>
        <TrpcProvider
          getToken={(...args) => rootStore.userStore.getTokenSilently(...args)}
          onUnauthorized={() => void rootStore.userStore.expireSession()}
        >
          {children}
        </TrpcProvider>
      </IdahoTHStoreContext.Provider>
    </RootStoreContext.Provider>
  );
};

export const useRootStore = (): RootStore => {
  const store = useContext(RootStoreContext);
  if (!store) throw new Error("useRootStore must be used within StoreProvider");
  return store;
};

export const useUserStore = (): UserStore => useRootStore().userStore;
