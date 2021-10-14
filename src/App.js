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

import * as Sentry from "@sentry/react";
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
import UsNdCommunityExplore from "./core/community/Explore";
import CoreLayout from "./core/CoreLayout";
import UsNdFacilitiesExplore from "./core/facilities/Explore";
import CoreGoalsView from "./core/goals/CoreGoalsView";
import PageMethodology from "./core/PageMethodology";
import PagePractices from "./core/PagePractices";
import PageProjections from "./core/PageProjections";
import PageSystem from "./core/PageSystem";
import PathwaysLayout from "./core/PathwaysLayout";
import PathwaysProfile from "./core/PathwaysProfile";
import {
  CORE_PATHS,
  CORE_VIEWS,
  PATHWAYS_PATHS,
  PATHWAYS_VIEWS,
} from "./core/views";
import LanternLayout from "./lantern/LanternLayout";
import Revocations from "./lantern/Revocations";
import { LANTERN_VIEWS } from "./lantern/views";
import ProtectedRoute from "./ProtectedRoute";
import RedirectHome from "./RedirectHome";
import { CORE_TENANTS } from "./RootStore/TenantStore/coreTenants";
import { LANTERN_TENANTS } from "./RootStore/TenantStore/lanternTenants";
import { PATHWAYS_TENANTS } from "./RootStore/TenantStore/pathwaysTenants";
import { initI18n } from "./utils/i18nSettings";
import initFontAwesome from "./utils/initFontAwesome";
import initIntercomSettings from "./utils/initIntercomSettings";

initFontAwesome();
initIntercomSettings();
initI18n();

Sentry.init({
  environment: process.env.REACT_APP_SENTRY_ENV,
  dsn: process.env.REACT_APP_SENTRY_DSN,
});

const SHARED_VIEWS = ["", "profile"];

// prettier-ignore
const App = () => (
  <StoreProvider>
    <SentryErrorBoundary>
      <Router>
        <QueryParamProvider ReactRouterRoute={Route}>
          <Switch>
            <Route path="/verify" component={VerificationNeeded} />
            <AuthWall>

              <LanternLayout tenantIds={LANTERN_TENANTS} views={Object.values(LANTERN_VIEWS).concat(SHARED_VIEWS)}>
                <Switch>
                  <Route path="/community/revocations" component={Revocations} />
                  <Route path="/profile" component={PathwaysProfile} />
                  <Redirect exact from="/" to="/community/revocations" />
                  <Redirect from="/revocations" to="/community/revocations" />
                  <NotFound />
                </Switch>
              </LanternLayout>

              <PathwaysLayout tenantIds={PATHWAYS_TENANTS} views={Object.values(PATHWAYS_VIEWS).concat("", "profile")}>
                <Switch>
                  <ProtectedRoute path={PATHWAYS_PATHS.system} component={PageSystem} />
                  <ProtectedRoute path={PATHWAYS_PATHS.operations} component={PagePractices} />
                  <ProtectedRoute path={PATHWAYS_PATHS.methodology} component={PageMethodology} />
                  <Route path="/profile" component={PathwaysProfile} />
                  <Redirect from="/system" to="/system/prison" />
                  <RedirectHome />
                  <NotFound />
                </Switch>
              </PathwaysLayout>

              <CoreLayout tenantIds={CORE_TENANTS}  views={Object.values(CORE_VIEWS).concat(SHARED_VIEWS)}>
                <Switch>
                  <ProtectedRoute path={CORE_PATHS.goals} component={CoreGoalsView} />
                  <ProtectedRoute path={CORE_PATHS.communityExplore} component={UsNdCommunityExplore} />
                  <ProtectedRoute path={CORE_PATHS.communityProjections} component={PageProjections} />
                  <ProtectedRoute path={CORE_PATHS.facilitiesExplore} component={UsNdFacilitiesExplore} />
                  <ProtectedRoute path={CORE_PATHS.facilitiesProjections} component={PageProjections} />
                  <ProtectedRoute path={CORE_PATHS.communityPractices} component={PagePractices}/>
                  <ProtectedRoute path={CORE_PATHS.methodology} component={PageMethodology} />
                  <Route path="/profile" component={PathwaysProfile} />
                  <RedirectHome />
                  <Redirect from="/snapshots" to="/goals" />
                  <Redirect from="/revocations" to="/goals" />
                  <Redirect from="/reincarcerations" to="/goals" />
                  <Redirect from="/community/goals" to="/goals" />
                  <Redirect from="/facilities/goals" to="/goals" />
                  <NotFound />
                </Switch>
              </CoreLayout>
            </AuthWall>
          </Switch>
        </QueryParamProvider>
      </Router>
    </SentryErrorBoundary>
  </StoreProvider>
);

export default App;
