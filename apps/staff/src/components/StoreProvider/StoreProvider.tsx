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

import React, { useContext } from "react";

import FirestoreStore from "../../FirestoreStore";
import { InsightsStore } from "../../InsightsStore/InsightsStore";
import store, { RootStore } from "../../RootStore";
import AnalyticsStore from "../../RootStore/AnalyticsStore";
import { FeatureVariantRecord } from "../../RootStore/types";
import type UserStore from "../../RootStore/UserStore";
import { WorkflowsStore } from "../../WorkflowsStore";
import { OpportunityType } from "../../WorkflowsStore/Opportunity";
import { OpportunityConfiguration } from "../../WorkflowsStore/Opportunity/OpportunityConfigurations";
import { WorkflowsRootStore } from "../../WorkflowsStore/WorkflowsRootStore";

type StoreContextType = {
  store: RootStore;
};

const StoreContext = React.createContext<undefined | StoreContextType>(
  undefined,
);

const StoreProvider: React.FC<{ children: React.ReactNode }> =
  function StoreProvider({ children }) {
    return (
      <StoreContext.Provider value={{ store }}>
        {children}
      </StoreContext.Provider>
    );
  };
export default StoreProvider;

/**
 * incrementally starts to enforce typing in RootStore consumers
 */
interface PartiallyTypedRootStore {
  insightsStore: InsightsStore;
  workflowsStore: WorkflowsStore;
  workflowsRootStore: WorkflowsRootStore;
  analyticsStore: AnalyticsStore;
  firestoreStore: FirestoreStore;
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
  const { activeFeatureVariants } = useUserStore();
  return activeFeatureVariants;
}

export function useOpportunityConfigurations(): Record<
  OpportunityType,
  OpportunityConfiguration
>;
export function useOpportunityConfigurations(
  opportunityType: OpportunityType,
): OpportunityConfiguration;
export function useOpportunityConfigurations(
  opportunityType?: OpportunityType,
) {
  const { opportunities } =
    useRootStore().workflowsRootStore.opportunityConfigurationStore;
  return opportunityType ? opportunities[opportunityType] : opportunities;
}
