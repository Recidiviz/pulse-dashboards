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

import { observer } from "mobx-react-lite";
import React from "react";

import { useRootStore } from "../../components/StoreProvider";
import { toTitleCase } from "../../utils";
import { PillButton } from "../WorkflowsJusticeInvolvedPersonProfile/styles";

const CaseloadTypeSelect = observer(
  function CaseloadTypeSelect(): React.ReactElement | null {
    const rootStore = useRootStore();
    const { workflowsStore } = rootStore;
    const {
      activeSystem,
      supportsMultipleSystems,
      rootStore: { currentTenantId },
    } = workflowsStore;

    if (!supportsMultipleSystems || !currentTenantId) return null;

    return (
      <>
        <PillButton
          onClick={() =>
            workflowsStore.updateActiveSystem(
              activeSystem === "SUPERVISION" ? "ALL" : "SUPERVISION",
            )
          }
          active={activeSystem === "SUPERVISION"}
        >
          {toTitleCase(
            workflowsStore.searchTitleOverride(
              "SUPERVISION",
              "Supervision Officer",
            ),
          )}
        </PillButton>
        <PillButton
          onClick={() =>
            workflowsStore.updateActiveSystem(
              activeSystem === "INCARCERATION" ? "ALL" : "INCARCERATION",
            )
          }
          active={activeSystem === "INCARCERATION"}
        >
          {toTitleCase(
            workflowsStore.searchTitleOverride("INCARCERATION", "Facility"),
          )}
        </PillButton>
      </>
    );
  },
);

export default CaseloadTypeSelect;
