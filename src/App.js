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

import { AVAILABLE_FONTS } from "@recidiviz/design-system";
import React from "react";
import {
  BrowserRouter as Router,
  Redirect,
  Route,
  Switch,
} from "react-router-dom";
import { ThemeProvider } from "styled-components/macro";
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
import PagePracticesV2 from "./core/PagePracticesV2";
import PageSystem from "./core/PageSystem";
import PathwaysLayout from "./core/PathwaysLayout";
import Profile from "./core/Profile";
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
import { isDemoMode } from "./utils/isDemoMode";

initFontAwesome();
if (!isDemoMode()) {
  initIntercomSettings();
}
initI18n();

const SHARED_VIEWS = ["", "profile"];

// prettier-ignore
const App = () => (
  <ThemeProvider theme={{
    fonts: {
      heading: AVAILABLE_FONTS.LIBRE_BASKERVILLE,
      body: AVAILABLE_FONTS.LIBRE_FRANKLIN,
      serif: AVAILABLE_FONTS.LIBRE_BASKERVILLE,
      sans: AVAILABLE_FONTS.LIBRE_FRANKLIN,
    }}
  }>
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
                    <ProtectedRoute path={PATHWAYS_PATHS.operations} component={PagePractices} />
                    <ProtectedRoute path={PATHWAYS_PATHS.methodology} component={PageMethodology} />
                    <ProtectedRoute path={PATHWAYS_PATHS.practices} component={PagePracticesV2} />
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

                <CoreLayout tenantIds={CORE_TENANTS}  views={Object.values(CORE_VIEWS).concat(SHARED_VIEWS)}>
                  <Switch>
                    <ProtectedRoute path={CORE_PATHS.goals} component={CoreGoalsView} />
                    <ProtectedRoute path={CORE_PATHS.communityExplore} component={UsNdCommunityExplore} />
                    <ProtectedRoute path={CORE_PATHS.facilitiesExplore} component={UsNdFacilitiesExplore} />
                    <ProtectedRoute path={CORE_PATHS.communityPractices} component={PagePractices}/>
                    <ProtectedRoute path={CORE_PATHS.methodology} component={PageMethodology} />
                    <Route path="/profile" component={Profile} />
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
        </SentryErrorBoundary>
      </Router>
    </StoreProvider>
  </ThemeProvider>
);

export default App;
