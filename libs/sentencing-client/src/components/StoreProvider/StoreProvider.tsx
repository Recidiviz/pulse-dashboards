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

import { createContext, useContext } from "react";

import { SentencingStore } from "../../datastores/SentencingStore";

const SentencingStoreContext = createContext<SentencingStore | null>(null);

export const StoreProvider: React.FC<{
  store: SentencingStore;
  children: React.ReactNode;
}> = ({ store, children }) => {
  return (
    <SentencingStoreContext.Provider value={store}>
      {children}
    </SentencingStoreContext.Provider>
  );
};

export const useStore = () => {
  const context = useContext(SentencingStoreContext);
  if (!context) {
    throw new Error("useRootStore must be used within a StoreProvider");
  }
  return context;
};
