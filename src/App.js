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

import "react-aspect-ratio/aspect-ratio.css";
import "./assets/scripts/index";
import "./assets/styles/index.scss";

import { useEffect } from "react";
import {
  BrowserRouter as Router,
  Redirect,
  Route,
  Switch,
} from "react-router-dom";
import tk from "timekeeper";
import { QueryParamProvider } from "use-query-params";

import AuthWall from "./AuthWall";
import NotFound from "./components/NotFound";
import SentryErrorBoundary from "./components/SentryErrorBoundary";
import StoreProvider from "./components/StoreProvider";
import StyledToaster from "./components/StyledToaster";
import VerificationNeeded from "./components/VerificationNeeded";
import DashboardLayout from "./core/DashboardLayout";
import PageImpact from "./core/PageImpact";
import PageMethodology from "./core/PageMethodology";
import PageOutliers from "./core/PageOutliers";
import PageSystem from "./core/PageSystem";
import PageVitals from "./core/PageVitals";
import PageWorkflows from "./core/PageWorkflows";
import Profile from "./core/Profile";
import {
  DASHBOARD_PATHS,
  DASHBOARD_VIEWS,
  IMPACT_PATHS,
  WORKFLOWS_PATHS,
} from "./core/views";
import LanternLayout from "./lantern/LanternLayout";
import Revocations from "./lantern/Revocations";
import { LANTERN_VIEWS } from "./lantern/views";
import ProtectedRoute from "./ProtectedRoute";
import RedirectHome from "./RedirectHome";
import { DASHBOARD_TENANTS } from "./RootStore/TenantStore/dashboardTenants";
import { LANTERN_TENANTS } from "./RootStore/TenantStore/lanternTenants";
import { initI18n } from "./utils/i18nSettings";
import initIntercomSettings from "./utils/initIntercomSettings";
import { isDemoMode } from "./utils/isDemoMode";

if (!isDemoMode()) {
  initIntercomSettings();
}
initI18n();

const SHARED_VIEWS = ["", "profile"];

function App() {
  useEffect(() => {
    if (isDemoMode()) {
      const demoDate = new Date("2022-03-22T10:30:00");
      tk.travel(demoDate); // Freeze time to the desired date and time
    }

    return () => {
      if (isDemoMode()) {
        tk.reset(); // Reset the time to the actual system time when the component is unmounted
      }
    };
  }, []);
  return (
    <StoreProvider>
      <Router>
        <SentryErrorBoundary>
          <QueryParamProvider ReactRouterRoute={Route}>
            <Switch>
              <Route path="/verify">
                <VerificationNeeded />
              </Route>
              <AuthWall>
                <DashboardLayout
                  tenantIds={DASHBOARD_TENANTS}
                  views={Object.values(DASHBOARD_VIEWS).concat(SHARED_VIEWS)}
                >
                  <Switch>
                    <Route path={DASHBOARD_PATHS.system}>
                      <ProtectedRoute>
                        <PageSystem />
                      </ProtectedRoute>
                    </Route>
                    <Route path={DASHBOARD_PATHS.operations}>
                      <ProtectedRoute>
                        <PageVitals />
                      </ProtectedRoute>
                    </Route>
                    <Route path={DASHBOARD_PATHS.methodology}>
                      <ProtectedRoute>
                        <PageMethodology />
                      </ProtectedRoute>
                    </Route>
                    <Route path={DASHBOARD_PATHS.outliers}>
                      <ProtectedRoute>
                        <PageOutliers />
                      </ProtectedRoute>
                    </Route>
                    <Route
                      path={`${WORKFLOWS_PATHS.workflows}/:opportunityType/:clientId/preview`}
                      render={() => (
                        <Redirect to={WORKFLOWS_PATHS.clientProfile} />
                      )}
                    />
                    <Route path={WORKFLOWS_PATHS.workflows}>
                      <ProtectedRoute>
                        <PageWorkflows />
                      </ProtectedRoute>
                    </Route>
                    <Route path={IMPACT_PATHS.impact}>
                      <ProtectedRoute>
                        <PageImpact />
                      </ProtectedRoute>
                    </Route>
                    <Route path="/profile">
                      <Profile />
                    </Route>
                    <Route
                      path="/system"
                      render={() => <Redirect to="/system/prison" />}
                    />
                    <Route path="/" render={() => <RedirectHome />} />
                    <NotFound />
                  </Switch>
                </DashboardLayout>

                <LanternLayout
                  tenantIds={LANTERN_TENANTS}
                  views={Object.values(LANTERN_VIEWS).concat(SHARED_VIEWS)}
                >
                  <Switch>
                    <Route path="/community/revocations">
                      <Revocations />
                    </Route>
                    <Route path="/profile">
                      <Profile />
                    </Route>
                    <Route
                      path="/revocations"
                      render={() => <Redirect to="/community/revocations" />}
                    />
                    <NotFound />
                  </Switch>
                </LanternLayout>
              </AuthWall>
            </Switch>
            <StyledToaster />
          </QueryParamProvider>
        </SentryErrorBoundary>
      </Router>
    </StoreProvider>
  );
}

export default App;
