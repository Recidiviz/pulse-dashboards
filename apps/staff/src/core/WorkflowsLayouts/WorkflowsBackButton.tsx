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

import { useRootStore } from "../../components/StoreProvider";
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
 * If the user's current page is a subpage of one of the basic Workflows routes
 * (e.g. tasks, clients, residents, or an opportunity page), displays "Back" and a link
 * to the parent page.
 *
 * If the user is on a basic Workflows page but not on the Workflows homepage, displays
 * "Home" and a link to the homepage.
 *
 * Otherwise, displays nothing.
 */
export const WorkflowsBackButton = observer(function WorkflowsBackButton() {
  const {
    workflowsStore: { homepage: workflowsHomepage, activePageIsHomepage },
  } = useRootStore();
  const location = useLocation();

  // slicing off empty string at 0 caused by leading slash,
  // and 1 which should always be "workflows"
  const pathSections = location.pathname.split("/").slice(2);
  if (pathSections.length >= 2) {
    return (
      <NavigationBackButton
        action={{
          url: parentOf(pathSections),
        }}
      >
        Back
      </NavigationBackButton>
    );
  }

  if (!activePageIsHomepage) {
    return (
      <NavigationBackButton action={{ url: workflowsUrl(workflowsHomepage) }}>
        Home
      </NavigationBackButton>
    );
  }

  return null;
});
