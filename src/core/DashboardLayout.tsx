// Recidiviz - a data platform for criminal justice reform
// Copyright (C) 2021 Recidiviz, Inc.
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

import "./DashboardLayout.scss";

import { palette } from "@recidiviz/design-system";
import cn from "classnames";
import { observer } from "mobx-react-lite";
import React from "react";
import { useLocation } from "react-router-dom";

import IE11Banner from "../components/IE11Banner";
import { useRootStore } from "../components/StoreProvider";
import useIntercom from "../hooks/useIntercom";
import useIsMobile from "../hooks/useIsMobile";
import CoreStoreProvider from "./CoreStoreProvider";
import ErrorBoundary from "./ErrorBoundary";
import { NavigationLayout } from "./NavigationLayout";
import PathwaysNavigation from "./PathwaysNavigation";
import ViewNavigation from "./ViewNavigation";
import { DASHBOARD_VIEWS } from "./views";

interface Props {
  children: React.ReactElement;
}

const DashboardLayout: React.FC<Props> = ({ children }): React.ReactElement => {
  useIntercom();
  const isMobile = useIsMobile();
  const { pathname } = useLocation();
  const currentView = pathname.split("/")[1];
  const {
    workflowsStore: {
      featureVariants: { responsiveRevamp },
    },
  } = useRootStore();

  return (
    <CoreStoreProvider>
      <ErrorBoundary>
        <div
          id="app"
          className={cn("DashboardLayout", {
            Operations:
              currentView === DASHBOARD_VIEWS.operations &&
              !isMobile &&
              !responsiveRevamp,
            Workflows: currentView === DASHBOARD_VIEWS.workflows,
          })}
        >
          {currentView === DASHBOARD_VIEWS.workflows || !isMobile ? (
            <ViewNavigation />
          ) : null}
          {currentView === DASHBOARD_VIEWS.operations &&
          responsiveRevamp &&
          !isMobile ? (
            <NavigationLayout backgroundColor={palette.marble3} />
          ) : null}
          <div className="DashboardLayout__main">
            <PathwaysNavigation />
            <IE11Banner />
            {children}
          </div>
        </div>
      </ErrorBoundary>
    </CoreStoreProvider>
  );
};

export default observer(DashboardLayout);
