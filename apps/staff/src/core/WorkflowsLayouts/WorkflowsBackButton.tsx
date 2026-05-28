// Recidiviz - a data platform for criminal justice reform
// Copyright (C) 2025 Recidiviz, Inc.
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
import { useLocation } from "react-router-dom";

import {
  useFeatureVariants,
  useRootStore,
} from "../../components/StoreProvider";
import { BackLink } from "../Link";
import { NavigationBackButton } from "../NavigationBackButton/NavigationBackButton";
import { isWorkflowsPathSection, workflowsUrl } from "../views";

// Return the parent section of the URL based on the current page.
export function parentOf(pathSections: string[]): string {
  if (isWorkflowsPathSection(pathSections[0])) {
    return workflowsUrl(pathSections[0]);
  }
  return workflowsUrl("opportunityClients", { urlSection: pathSections[0] });
}

/**
 * General back/home button that can be used anywhere in Workflows.
 *
 * - On a subpage of a core Workflows route (e.g. tasks, clients, residents, or
 *   an opportunity page) displays "Back" via the generic `BackLink`: a plain
 *   left-click goes back in browser history (returning the user to wherever
 *   they came from, e.g. My Caseload), while right-click / cmd-click can open
 *   the origin in a new tab. A deep link with no origin falls back to the
 *   computed parent route.
 * - On a main Workflows page (but not the homepage) displays "Home" and links
 *   to the Workflows homepage.
 * - Returns nothing if already on the homepage.
 */
export const WorkflowsBackButton = observer(function WorkflowsBackButton() {
  const {
    workflowsStore: { homepage: workflowsHomepage, activePageIsHomepage },
  } = useRootStore();
  const { hideWorkflowsOpportunities } = useFeatureVariants();
  const location = useLocation();

  // slicing off empty string at 0 caused by leading slash,
  // and 1 which should always be "workflows"
  const pathSections = location.pathname.split("/").slice(2);
  const isSubpage = pathSections.length >= 2;

  if (isSubpage) {
    return <BackLink fallbackUrl={parentOf(pathSections)}>Back</BackLink>;
  }

  // Home button
  if (!activePageIsHomepage && !hideWorkflowsOpportunities) {
    return (
      <NavigationBackButton action={{ url: workflowsUrl(workflowsHomepage) }}>
        Home
      </NavigationBackButton>
    );
  }

  return null;
});
