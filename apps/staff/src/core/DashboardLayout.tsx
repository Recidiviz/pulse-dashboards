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

import "./DashboardLayout.scss";

import cn from "classnames";
import { observer } from "mobx-react-lite";
import React from "react";
import { Navigate, Route, Routes, useLocation } from "react-router-dom";

import { palette } from "~design-system";
import { PSI_PATHS } from "~sentencing-client";

import IE11Banner from "../components/IE11Banner";
import NotFound from "../components/NotFound";
import {
  PartiallyTypedRootStore,
  useRootStore,
} from "../components/StoreProvider";
import useIntercom from "../hooks/useIntercom";
import useIsMobile from "../hooks/useIsMobile";
import RedirectMethodology from "../RedirectMethodology";
import { DASHBOARD_TENANTS } from "../RootStore/TenantStore/dashboardTenants";
import {
  getPathsFromNavigation,
  getPathWithoutParams,
} from "../utils/navigation";
import CoreStoreProvider from "./CoreStoreProvider";
import ErrorBoundary from "./ErrorBoundary";
import { NavigationLayout } from "./NavigationLayout";
import PageInsights from "./PageInsights";
import PageMethodology from "./PageMethodology";
import PagePSI from "./PagePSI";
import PageSystem from "./PageSystem";
import PageVitals from "./PageVitals";
import PageWorkflows from "./PageWorkflows";
import PathwaysNavigation from "./PathwaysNavigation";
import { Redirect } from "./Redirect";
import {
  DASHBOARD_PATHS,
  DASHBOARD_VIEWS,
  INSIGHTS_PATHS,
  WORKFLOWS_PATHS,
} from "./views";

const ALL_DASHBOARD_VIEWS = [
  ...Object.values(DASHBOARD_VIEWS),
  "",
  "profile",
  "id-methodology",
];

const DashboardLayout: React.FC = () => {
  useIntercom();
  const isMobile = useIsMobile();
  const { pathname } = useLocation();
  const currentView = pathname.split("/")[1];
  // TODO(#5636) Eliminate PartiallyTypedRootStore
  const {
    currentTenantId,
    userStore: { userAllowedNavigation },
  } = useRootStore() as PartiallyTypedRootStore;
  const dashboardAllowedPaths = [
    ...getPathsFromNavigation(userAllowedNavigation),
    "/profile",
    "/system",
  ];

  if (
    !(
      DASHBOARD_TENANTS.includes(currentTenantId) &&
      ALL_DASHBOARD_VIEWS.includes(currentView) &&
      dashboardAllowedPaths.includes(getPathWithoutParams(pathname))
    )
  ) {
    return <NotFound />;
  }

  return (
    <CoreStoreProvider>
      <ErrorBoundary>
        <div
          id="app"
          className={cn("DashboardLayout", {
            Workflows: currentView === DASHBOARD_VIEWS.workflows,
            Insights: currentView === DASHBOARD_VIEWS.insights,
            PSI: currentView === DASHBOARD_VIEWS.psi,
          })}
        >
          {currentView === DASHBOARD_VIEWS.operations && !isMobile ? (
            <NavigationLayout backgroundColor={palette.marble3} />
          ) : null}
          <div className="DashboardLayout__main">
            <PathwaysNavigation />
            <IE11Banner />
            <Routes>
              <Route path={DASHBOARD_PATHS.system} element={<PageSystem />} />
              <Route
                path={DASHBOARD_PATHS.operations}
                element={<PageVitals />}
              />
              <Route
                path={DASHBOARD_PATHS.methodology}
                element={<PageMethodology />}
              />
              <Route
                path={`${DASHBOARD_PATHS.insights}/*`}
                element={<PageInsights />}
              />
              <Route
                path={`${DASHBOARD_PATHS.insights}`}
                element={<Navigate replace to={INSIGHTS_PATHS.supervision} />}
              />
              <Route
                path={`${DASHBOARD_PATHS.insights}/supervision/staff/:officerPseudoId/adverse-outcome/:metricId`}
                element={
                  <Redirect to={`${INSIGHTS_PATHS.supervisionStaffMetric}`} />
                }
              />
              <Route
                path={`${WORKFLOWS_PATHS.workflows}/*`}
                element={<PageWorkflows />}
              />
              <Route path={`${PSI_PATHS.psi}/*`} element={<PagePSI />} />
              {/* TODO(#4601): Remove redirect after confirming no longer in use */}
              <Route
                path="/id-methodology/:dashboard"
                element={<RedirectMethodology />}
              />
              <Route
                path="/system"
                element={<Navigate replace to="/system/prison" />}
              />
              <Route path="*" element={<NotFound />} />
            </Routes>
          </div>
        </div>
      </ErrorBoundary>
    </CoreStoreProvider>
  );
};

export default observer(DashboardLayout);
