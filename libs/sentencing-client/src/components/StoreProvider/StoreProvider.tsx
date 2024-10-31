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

import { PSIStore } from "../../datastores/PSIStore";

const PSIStoreContext = createContext<PSIStore | null>(null);

export const StoreProvider: React.FC<{
  store: PSIStore;
  children: React.ReactNode;
}> = ({ store, children }) => {
  return (
    <PSIStoreContext.Provider value={store}>
      {children}
    </PSIStoreContext.Provider>
  );
};

export const useStore = () => {
  const context = useContext(PSIStoreContext);
  if (!context) {
    throw new Error("useRootStore must be used within a StoreProvider");
  }
  return context;
};
