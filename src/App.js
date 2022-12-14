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

import "./assets/scripts/index";
import "./assets/styles/index.scss";

import React from "react";
import {
  BrowserRouter as Router,
  Redirect,
  Route,
  Switch,
} from "react-router-dom";
import { QueryParamProvider } from "use-query-params";

import AuthWall from "./AuthWall";
import NotFound from "./components/NotFound";
import SentryErrorBoundary from "./components/SentryErrorBoundary";
import StoreProvider from "./components/StoreProvider";
import VerificationNeeded from "./components/VerificationNeeded";
import PageMethodology from "./core/PageMethodology";
import PageSystem from "./core/PageSystem";
import PageVitals from "./core/PageVitals";
import PageWorkflows from "./core/PageWorkflows";
import PathwaysLayout from "./core/PathwaysLayout";
import Profile from "./core/Profile";
import { PATHWAYS_PATHS, PATHWAYS_VIEWS, WORKFLOWS_PATHS } from "./core/views";
import LanternLayout from "./lantern/LanternLayout";
import Revocations from "./lantern/Revocations";
import { LANTERN_VIEWS } from "./lantern/views";
import ProtectedRoute from "./ProtectedRoute";
import RedirectHome from "./RedirectHome";
import { LANTERN_TENANTS } from "./RootStore/TenantStore/lanternTenants";
import { PATHWAYS_TENANTS } from "./RootStore/TenantStore/pathwaysTenants";
import { initI18n } from "./utils/i18nSettings";
import initIntercomSettings from "./utils/initIntercomSettings";
import { isDemoMode } from "./utils/isDemoMode";

if (!isDemoMode()) {
  initIntercomSettings();
}
initI18n();

const SHARED_VIEWS = ["", "profile"];

// prettier-ignore
const App = () => (
    <StoreProvider>
      <Router>
        <SentryErrorBoundary>
          <QueryParamProvider ReactRouterRoute={Route}>
            <Switch>
              <Route path="/verify" component={VerificationNeeded} />
              <AuthWall>
                <PathwaysLayout tenantIds={PATHWAYS_TENANTS} views={Object.values(PATHWAYS_VIEWS).concat(SHARED_VIEWS)}>
                  <Switch>
                    <ProtectedRoute path={PATHWAYS_PATHS.system} component={PageSystem} />
                    <ProtectedRoute path={PATHWAYS_PATHS.operations} component={PageVitals} />
                    <ProtectedRoute path={PATHWAYS_PATHS.methodology} component={PageMethodology} />
                    <Redirect from={`${WORKFLOWS_PATHS.workflows}/:opportunityType/:clientId/preview`} to={WORKFLOWS_PATHS.clientProfile} />
                    <ProtectedRoute path={WORKFLOWS_PATHS.workflows} component={PageWorkflows} />
                    <Route path="/profile" component={Profile} />
                    <Redirect from="/system" to="/system/prison" />
                    <RedirectHome />
                    <NotFound />
                  </Switch>
                </PathwaysLayout>

                <LanternLayout tenantIds={LANTERN_TENANTS} views={Object.values(LANTERN_VIEWS).concat(SHARED_VIEWS)}>
                  <Switch>
                    <Route path="/community/revocations" component={Revocations} />
                    <Route path="/profile" component={Profile} />
                    <Redirect from="/revocations" to="/community/revocations" />
                    <NotFound />
                  </Switch>
                </LanternLayout>
              </AuthWall>
            </Switch>
          </QueryParamProvider>
        </SentryErrorBoundary>
      </Router>
    </StoreProvider>
);

export default App;
