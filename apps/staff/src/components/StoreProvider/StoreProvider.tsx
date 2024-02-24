// Recidiviz - a data platform for criminal justice reform
// Copyright (C) 2020 Recidiviz, Inc.
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

import { reaction } from "mobx";
import { observer } from "mobx-react-lite";
import PropTypes from "prop-types";
import React, { useContext, useEffect, useMemo, useState } from "react";

import { OutliersStore } from "../../OutliersStore/OutliersStore";
import store, { RootStore } from "../../RootStore";
import AnalyticsStore from "../../RootStore/AnalyticsStore";
import { FeatureVariantRecord } from "../../RootStore/types";
import type UserStore from "../../RootStore/UserStore";
import { WorkflowsStore } from "../../WorkflowsStore";

type StoreContextType = {
  store: RootStore;
  featureVariants: FeatureVariantRecord;
};

const StoreContext = React.createContext<undefined | StoreContextType>(
  undefined
);

const StoreProvider: React.FC = observer(function StoreProvider({ children }) {
  const { userStore } = store;
  const [featureVariants, setFeatureVariants] = useState<FeatureVariantRecord>(
    userStore.activeFeatureVariants
  );

  useEffect(() => {
    const disposer = reaction(
      () => userStore.activeFeatureVariants,
      (activeFeatureVariants: FeatureVariantRecord) => {
        setFeatureVariants(activeFeatureVariants);
      }
    );

    return () => disposer();
  }, [userStore]);

  const contextValue = useMemo(() => {
    return { store, featureVariants };
  }, [featureVariants]);

  return (
    <StoreContext.Provider value={contextValue}>
      {children}
    </StoreContext.Provider>
  );
});

StoreProvider.propTypes = {
  children: PropTypes.node.isRequired,
};

export default StoreProvider;

/**
 * incrementally starts to enforce typing in RootStore consumers
 */
interface PartiallyTypedRootStore {
  outliersStore: OutliersStore;
  workflowsStore: WorkflowsStore;
  analyticsStore: AnalyticsStore;
  [key: string]: any;
}

export function useRootStore(): PartiallyTypedRootStore {
  const context = useContext(StoreContext);
  if (context === undefined) {
    throw new Error("useRootStore must be used within a StoreProvider");
  }
  return context.store;
}

export function useUserStore(): UserStore {
  const { userStore } = useRootStore();
  return userStore;
}

export function useFeatureVariants(): FeatureVariantRecord {
  const context = useContext(StoreContext);
  if (!context) {
    throw new Error("useFeatureVariants must be used within a StoreProvider");
  }
  return context.featureVariants;
}
