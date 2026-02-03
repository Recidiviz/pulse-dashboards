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

import { SystemId } from "~datatypes";

import {
  useFeatureVariants,
  useRootStore,
} from "../../components/StoreProvider";
import useIsMobile from "../../hooks/useIsMobile";
import { toTitleCase } from "../../utils";
import { getJusticeInvolvedPersonTitle } from "../../WorkflowsStore/utils";
import { DASHBOARD_VIEWS, WorkflowsPathSection, workflowsUrl } from "../views";

export const SYSTEM_ID_TO_PATH: Record<SystemId, WorkflowsPathSection> = {
  SUPERVISION: "clients",
  INCARCERATION: "residents",
  ALL: "home",
} as const;

export const OverviewNavLinks: React.FC = observer(function OverviewNavLinks() {
  const { pathname } = useLocation();
  const { isMobile } = useIsMobile(true);
  const { hideWorkflowsOpportunities } = useFeatureVariants();

  const {
    workflowsStore,
    workflowsStore: {
      isSupervisionTasksLinkEnabled,
      workflowsSupportedSystems,
      supportsMultipleSystems,
      homepage,
      homepageNameOverride,
      activeSystem,
    },
    userStore: { userAllowedNavigation },
  } = useRootStore();

  const enableWorkflows =
    (userAllowedNavigation?.workflows || []).length > 0 &&
    !hideWorkflowsOpportunities;
  const enableMilestones = (userAllowedNavigation?.workflows || []).includes(
    "milestones",
  );
  const enabledInsights = (userAllowedNavigation?.insights || []).length > 0;
  const enableSystems = !supportsMultipleSystems || !isMobile;
  const enableRNA =
    activeSystem !== "SUPERVISION" &&
    !!(userAllowedNavigation?.workflows || []).includes("rna");

  const workflowsHomepageName = homepageNameOverride ?? "Opportunities";

  // TODO(#7613): Dynamically dedupe nav links when homepage is a normal tab
  // and/or consider using userAllowedNavigation.workflows[0] instead of homepage
  return (
    <>
      {enabledInsights && (
        <NavLink to={`/${DASHBOARD_VIEWS.insights}`} role="menuitem">
          Overview
        </NavLink>
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
          role="menuitem"
        >
          {workflowsHomepageName}
        </NavLink>
      )}
      {enableRNA && (
        <NavLink to={workflowsUrl("rna")} role="menuitem">
          RNA Viewer
        </NavLink>
      )}
      {enableMilestones && (
        <NavLink to={workflowsUrl("milestones")} role="menuitem">
          Kudos
        </NavLink>
      )}
      {isSupervisionTasksLinkEnabled && (
        <NavLink
          to={workflowsUrl("tasks")}
          onClick={() => workflowsStore.updateActiveSystem("SUPERVISION")}
          role="menuitem"
        >
          Tasks
        </NavLink>
      )}
      {enableSystems
        ? workflowsSupportedSystems?.map((systemId: SystemId) => {
            const path = SYSTEM_ID_TO_PATH[systemId];

            // Don't duplicate the "Home" nav link.
            // When hideWorkflowsOpportunities is set, we don't render the "Home" link,
            // so there's no duplication.
            if (path === homepage && !hideWorkflowsOpportunities) {
              return null;
            }

            // Don't show Clients/Residents links when the user does not have access to
            // the page.
            if (!userAllowedNavigation?.workflows?.includes(path)) {
              return null;
            }
            return (
              <NavLink
                key={systemId}
                to={workflowsUrl(path)}
                onClick={() => workflowsStore.updateActiveSystem(systemId)}
                role="menuitem"
              >
                {toTitleCase(getJusticeInvolvedPersonTitle(systemId))}s
              </NavLink>
            );
          })
        : null}
    </>
  );
});
