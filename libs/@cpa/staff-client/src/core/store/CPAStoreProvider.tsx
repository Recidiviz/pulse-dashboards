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

import { createContext, ReactNode, useContext } from "react";

import { CPAStore } from "./CPAStore";

const CPAStoreContext = createContext<CPAStore | undefined>(undefined);

type CPAStoreProviderProps = {
  store: CPAStore;
  children: ReactNode;
};

export function CPAStoreProvider({ store, children }: CPAStoreProviderProps) {
  return (
    <CPAStoreContext.Provider value={store}>
      {children}
    </CPAStoreContext.Provider>
  );
}

export function useCPAStore(): CPAStore {
  const store = useContext(CPAStoreContext);
  if (!store) {
    throw new Error("useCPAStore must be used within a CPAStoreProvider");
  }
  return store;
}
