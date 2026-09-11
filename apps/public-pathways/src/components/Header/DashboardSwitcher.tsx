// Recidiviz - a data platform for criminal justice reform
// Copyright (C) 2026 Recidiviz, Inc.
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
import { useNavigate } from "react-router-dom";

import { Dropdown, Icon } from "~design-system";
import { getPageCopy } from "~shared-pathways";

import {
  DASHBOARD_CADENCE_LABELS,
  PUBLIC_PATHWAYS_DASHBOARD_PAGES,
  PublicPathwaysDashboardPage,
} from "../../datastores/dashboards";
import { useRootStore } from "../StoreProvider";
import {
  CadenceLabel,
  CheckSlot,
  DashboardMenuItem,
  DashboardMenuPanel,
  DashboardToggle,
  VisuallyHidden,
} from "./DashboardSwitcher.styles";

/**
 * Header control that switches between the dashboards this app serves. Each
 * option gives the dashboard's name and how often its data is refreshed.
 */
export const DashboardSwitcher = observer(function DashboardSwitcher() {
  const navigate = useNavigate();
  const { currentTenantId, page, analyticsStore } = useRootStore();
  const pageCopy = getPageCopy(currentTenantId);

  const selectDashboard = (selectedPage: PublicPathwaysDashboardPage) => {
    if (selectedPage === page) return;
    analyticsStore.trackDashboardSelected({ pageId: selectedPage });
    // Navigation alone updates the store, because useRouteSync reads the page
    // from the route. It also drops the previous dashboard's query params.
    navigate(`/${selectedPage}`);
  };

  return (
    <Dropdown>
      <DashboardToggle kind="secondary" shape="pill" showCaret>
        {pageCopy[page].title}{" "}
        <CadenceLabel>&middot; {DASHBOARD_CADENCE_LABELS[page]}</CadenceLabel>
      </DashboardToggle>
      <DashboardMenuPanel alignment="right" ariaLabel="Select a dashboard">
        {PUBLIC_PATHWAYS_DASHBOARD_PAGES.map((dashboardPage) => (
          <DashboardMenuItem
            key={dashboardPage}
            $active={dashboardPage === page}
            onClick={() => selectDashboard(dashboardPage)}
          >
            <CheckSlot>
              {dashboardPage === page && (
                <>
                  <Icon kind="Check" size={10} />
                  <VisuallyHidden>Selected</VisuallyHidden>
                </>
              )}
            </CheckSlot>
            {pageCopy[dashboardPage].title}{" "}
            <CadenceLabel>
              &middot; {DASHBOARD_CADENCE_LABELS[dashboardPage]}
            </CadenceLabel>
          </DashboardMenuItem>
        ))}
      </DashboardMenuPanel>
    </Dropdown>
  );
});
