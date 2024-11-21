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
  PartiallyTypedRootStore,
  useRootStore,
} from "../../components/StoreProvider";
import useIsMobile from "../../hooks/useIsMobile";
import { toTitleCase } from "../../utils";
import { getJusticeInvolvedPersonTitle } from "../../WorkflowsStore/utils";
import { SystemId } from "../models/types";
import { DASHBOARD_VIEWS, WorkflowsPage, workflowsUrl } from "../views";

export const SYSTEM_ID_TO_PATH: Record<SystemId, WorkflowsPage> = {
  SUPERVISION: "clients",
  INCARCERATION: "residents",
  ALL: "home",
} as const;

export const OverviewNavLinks: React.FC = observer(function OverviewNavLinks() {
  const { pathname } = useLocation();
  const { isMobile } = useIsMobile(true);

  // TODO(#5636) Eliminate PartiallyTypedRootStore
  const {
    workflowsStore,
    workflowsStore: {
      allowSupervisionTasks,
      workflowsSupportedSystems,
      supportsMultipleSystems,
      homepage,
      homepageNameOverride,
    },
    userStore: { userAllowedNavigation },
    insightsStore: { shouldUseSupervisorHomepageUI: supervisorHomepage },
  } = useRootStore() as PartiallyTypedRootStore;

  const enableWorkflows = (userAllowedNavigation.workflows || []).length > 0;
  const enableMilestones = (userAllowedNavigation.workflows || []).includes(
    "milestones",
  );
  const enabledInsights =
    !!userAllowedNavigation.insights && supervisorHomepage;
  const enableSystems =
    (supervisorHomepage && (!supportsMultipleSystems || !isMobile)) ||
    !supervisorHomepage;
  const workflowsHomepageName =
    homepageNameOverride ?? (supervisorHomepage ? "Opportunities" : "Home");

  return (
    <>
      {enabledInsights && (
        <NavLink to={`/${DASHBOARD_VIEWS.insights}`}>Overview</NavLink>
      )}
      {enableWorkflows && (
        <NavLink
          to={workflowsUrl(homepage)}
          end={
            (enableSystems &&
              workflowsSupportedSystems?.some((systemId: SystemId) =>
                pathname.includes(getJusticeInvolvedPersonTitle(systemId)),
              )) ||
            pathname.includes("tasks")
          }
        >
          {workflowsHomepageName}
        </NavLink>
      )}
      {enableMilestones && (
        <NavLink to={workflowsUrl("milestones")}>Milestones</NavLink>
      )}
      {allowSupervisionTasks && enableWorkflows && (
        <NavLink
          to={workflowsUrl("tasks")}
          onClick={() => workflowsStore.updateActiveSystem("SUPERVISION")}
        >
          Tasks
        </NavLink>
      )}
      {enableSystems
        ? workflowsSupportedSystems?.map((systemId: SystemId) => {
            const path = SYSTEM_ID_TO_PATH[systemId];
            if (path === homepage) {
              return null;
            }
            return (
              <NavLink
                key={systemId}
                to={workflowsUrl(path)}
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
