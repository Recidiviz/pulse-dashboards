// Recidiviz - a data platform for criminal justice reform
// Copyright (C) 2024 Recidiviz, Inc.
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

import React, { useContext, useRef } from "react";

import RootStore from "../RootStore";
import type UserStore from "../RootStore/UserStore";
import LanternStore from "./LanternStore";
import type DataStore from "./LanternStore/DataStore/DataStore";
import type FiltersStore from "./LanternStore/FiltersStore";

const LanternContext = React.createContext<LanternStore | undefined>(undefined);

interface ProviderProps {
  children: React.ReactElement;
}

const LanternStoreProvider: React.FC<ProviderProps> = ({ children }) => {
  const lanternStore = useRef(new LanternStore(RootStore));
  return (
    <LanternContext.Provider value={lanternStore.current}>
      {children}
    </LanternContext.Provider>
  );
};

export function useLanternStore(): LanternStore {
  const context = useContext(LanternContext);
  if (context === undefined) {
    throw new Error(
      "useLanternStore must be used within a LanternStoreProvider",
    );
  }
  return context;
}

export function useDataStore(): DataStore {
  const { dataStore } = useLanternStore();
  return dataStore;
}

export function useFiltersStore(): FiltersStore {
  const { filtersStore } = useLanternStore();
  return filtersStore;
}

export function useUserStore(): UserStore {
  const { userStore } = useLanternStore();
  return userStore;
}

export default LanternStoreProvider;
