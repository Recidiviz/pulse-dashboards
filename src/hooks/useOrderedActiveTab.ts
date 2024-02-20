// Recidiviz - a data platform for criminal justice reform
// Copyright (C) 2023 Recidiviz, Inc.
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
import { intersection } from "lodash";
import { Dispatch, SetStateAction, useEffect, useState } from "react";

import { useRootStore } from "../components/StoreProvider";
import { OpportunityTab } from "../WorkflowsStore";
import { getTabOrderForOpportunityType } from "../WorkflowsStore/Opportunity/utils/tabUtils";

type OrderedActiveTab = {
  displayTabs: OpportunityTab[];
  activeTab: OpportunityTab;
  setActiveTab: Dispatch<SetStateAction<OpportunityTab>>;
};

export const useOrderedActiveTab: () => OrderedActiveTab =
  (): OrderedActiveTab => {
    const {
      workflowsStore: {
        selectedOpportunityType: opportunityType,
        opportunitiesByTab,
      },
    } = useRootStore();
    const [activeTab, setActiveTab] = useState<OpportunityTab>("Eligible Now");
    const [displayTabs, setDisplayTabs] = useState<OpportunityTab[]>([
      "Eligible Now",
    ]);

    useEffect(() => {
      if (opportunityType) {
        const opportunityTabs = opportunitiesByTab[opportunityType];

        const tabOrder = getTabOrderForOpportunityType(opportunityType);

        const tabsForDisplay: OpportunityTab[] = intersection(
          tabOrder,
          Object.keys(opportunityTabs ?? {})
        ) as OpportunityTab[];

        setDisplayTabs(tabsForDisplay);
        setActiveTab(tabsForDisplay[0]);
      }
    }, [opportunityType, opportunitiesByTab]);

    return { displayTabs, activeTab, setActiveTab };
  };
