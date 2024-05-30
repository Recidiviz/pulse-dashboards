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
import { NavLink, useLocation } from "react-router-dom";

import {
  useFeatureVariants,
  useRootStore,
} from "../../components/StoreProvider";
import { toTitleCase } from "../../utils";
import { getJusticeInvolvedPersonTitle } from "../../WorkflowsStore/utils";
import { SystemId } from "../models/types";
import { DASHBOARD_VIEWS, WorkflowsPage, workflowsUrl } from "../views";

export const SYSTEM_ID_TO_PATH: Record<SystemId, WorkflowsPage> = {
  SUPERVISION: "caseloadClients",
  INCARCERATION: "caseloadResidents",
  ALL: "home",
} as const;

export const OverviewNavLinks: React.FC = observer(function OverviewNavLinks() {
  const { pathname } = useLocation();
  const { supervisorHomepage } = useFeatureVariants();

  const {
    workflowsStore,
    workflowsStore: {
      allowSupervisionTasks,
      workflowsSupportedSystems,
      supportsMultipleSystems,
    },
    userStore: { userAllowedNavigation },
  } = useRootStore();

  const enableWorkflows = (userAllowedNavigation.workflows || []).length > 0;
  const enabledInsights =
    !!userAllowedNavigation.insights && supervisorHomepage;
  const enableSystems =
    (!!supervisorHomepage && !supportsMultipleSystems) || !supervisorHomepage;

  return (
    <>
      {enabledInsights && (
        <NavLink to={`/${DASHBOARD_VIEWS.insights}`}>Overview</NavLink>
      )}
      {enableWorkflows && (
        <NavLink
          to={workflowsUrl("workflows")}
          end={
            (enableSystems &&
              workflowsSupportedSystems?.some((systemId: SystemId) =>
                pathname.includes(getJusticeInvolvedPersonTitle(systemId)),
              )) ||
            pathname.includes("tasks")
          }
        >
          {supervisorHomepage ? "Opportunities" : "Home"}
        </NavLink>
      )}
      {allowSupervisionTasks && (
        <NavLink
          to={workflowsUrl("tasks")}
          onClick={() => workflowsStore.updateActiveSystem("SUPERVISION")}
        >
          Tasks
        </NavLink>
      )}
      {enableSystems
        ? workflowsSupportedSystems?.map((systemId: SystemId) => {
            return (
              <NavLink
                key={systemId}
                to={workflowsUrl(SYSTEM_ID_TO_PATH[systemId])}
                onClick={() => workflowsStore.updateActiveSystem(systemId)}
              >
                {toTitleCase(getJusticeInvolvedPersonTitle(systemId))}s
              </NavLink>
            );
          })
        : null}
    </>
  );
});
