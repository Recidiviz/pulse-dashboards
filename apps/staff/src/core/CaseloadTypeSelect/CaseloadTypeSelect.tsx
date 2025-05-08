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

import { intersection, uniq } from "lodash";
import { observer } from "mobx-react-lite";
import React from "react";

import { useRootStore } from "../../components/StoreProvider";
import { toTitleCase } from "../../utils";
import { SystemId } from "../models/types";
import { PillButton } from "../WorkflowsJusticeInvolvedPersonProfile/styles";

const CaseloadTypeSelect = observer(
  function CaseloadTypeSelect(): React.ReactElement | null {
    const rootStore = useRootStore();
    const { workflowsStore } = rootStore;
    const {
      activeSystem,
      rootStore: { currentTenantId },
      systemConfigFor,
      workflowsSupportedSystems,
      searchStore: { searchType, handleSearchPillClick },
    } = workflowsStore;

    if (!currentTenantId || !activeSystem || !workflowsSupportedSystems)
      return null;

    const systems: Exclude<SystemId, "ALL">[] = intersection(
      ["SUPERVISION", "INCARCERATION"],
      workflowsSupportedSystems as Exclude<SystemId, "ALL">[],
    );

    const searchTitles = uniq(
      systems.flatMap((system) =>
        systemConfigFor(system).search.map(
          (searchConfig) => searchConfig.searchTitle,
        ),
      ),
    );
    if (searchTitles.length === 1) return null;

    return (
      <>
        {systems.map((system) => {
          if (
            (systemConfigFor(system).search.length === 1 &&
              workflowsStore.activePage.page !== "home") ||
            (workflowsStore.activePage.page !== "home" &&
              workflowsStore.activeSystem !== system)
          )
            return null;
          return systemConfigFor(system).search.map((searchConfig) => (
            <PillButton
              onClick={() =>
                handleSearchPillClick(searchConfig.searchType, system)
              }
              active={searchType === searchConfig.searchType}
            >
              {searchConfig.searchTitleIgnoreCase
                ? searchConfig.searchTitle
                : toTitleCase(searchConfig.searchTitle)}
            </PillButton>
          ));
        })}
      </>
    );
  },
);

export default CaseloadTypeSelect;
