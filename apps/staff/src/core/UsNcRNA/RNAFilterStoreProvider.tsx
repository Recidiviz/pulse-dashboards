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

import { observer } from "mobx-react-lite";
import { createContext, FC, ReactNode, useContext } from "react";

import { useRootStore } from "../../components/StoreProvider";
import UsNcRNAFilterStore from "../../FilterStore/UsNcRNAFilterStore";

/**
 * Provides a UsNcRNAFilterStore to child components.
 * Consume with useRNAFilterStoreContext()
 */
const RNAFilterStoreContext = createContext<
  undefined | { store: UsNcRNAFilterStore }
>(undefined);

export function useRNAFilterStore(): UsNcRNAFilterStore {
  const context = useContext(RNAFilterStoreContext);
  if (context === undefined) {
    throw new Error(
      "useRNAFilterStore must be used within a RNAFilterStoreProvider",
    );
  }
  return context.store;
}

export const RNAFilterStoreProvider: FC<{ children: ReactNode }> = observer(
  function RNAFilterStoreProvider({ children }) {
    const { workflowsStore, analyticsStore } = useRootStore();

    return (
      <RNAFilterStoreContext.Provider
        value={{
          store: new UsNcRNAFilterStore(analyticsStore, workflowsStore),
        }}
      >
        {children}
      </RNAFilterStoreContext.Provider>
    );
  },
);
