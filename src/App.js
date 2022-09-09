// Recidiviz - a data platform for criminal justice reform
// Copyright (C) 2020 Recidiviz, Inc.
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

import React from "react";
import {
  Redirect,
  Route,
  Switch,
  BrowserRouter as Router,
} from "react-router-dom";

import TenantRoutes from "./components/TenantRoutes";
import { StateCodeProvider } from "./contexts/StateCodeContext";
import NotFound from "./views/NotFound";
import Profile from "./views/Profile";
import VerificationNeeded from "./views/VerificationNeeded";
import UsMoLayout from "./views/tenants/us_mo/Layout";
import UsMoCommunityRevocations from "./views/tenants/us_mo/community/Revocations";
import UsNdLayout from "./views/tenants/us_nd/Layout";
import UsNdCommunityGoals from "./views/tenants/us_nd/community/Goals";
import UsNdCommunityExplore from "./views/tenants/us_nd/community/Explore";
import UsNdFacilitiesGoals from "./views/tenants/us_nd/facilities/Goals";
import UsNdFacilitiesExplore from "./views/tenants/us_nd/facilities/Explore";
import UsNdProgrammingExplore from "./views/tenants/us_nd/programming/Explore";
import UsPaLayout from "./views/tenants/us_pa/Layout";
import UsPaCommunityRevocations from "./views/tenants/us_pa/community/Revocations";
import initFontAwesome from "./utils/initFontAwesome";
import { initIntercomSettings } from "./utils/intercomSettings";
import { initI18n } from "./views/tenants/utils/i18nSettings";

import "./assets/scripts/index";
import "./assets/styles/index.scss";
import * as lanternTenant from "./views/tenants/utils/lanternTenants";
import * as coreTenant from "./views/tenants/utils/coreTenants";

initFontAwesome();
initIntercomSettings();
initI18n();

// prettier-ignore
const App = () => (
  <StateCodeProvider>
    <Router>
      <Switch>
        <Route path="/verify" component={VerificationNeeded} />

        <TenantRoutes>
          <UsMoLayout stateCode={lanternTenant.MO}>
            <Switch>
              <Route path="/community/revocations" component={UsMoCommunityRevocations} />
              <Route path="/profile" component={Profile} />
              <Redirect exact from="/" to="/community/revocations" />
              <Redirect from="/revocations" to="/community/revocations" />
              <NotFound />
            </Switch>
          </UsMoLayout>

          <UsNdLayout stateCode={coreTenant.ND}>
            <Switch>
              <Route path="/community/goals" component={UsNdCommunityGoals} />
              <Route path="/community/explore" component={UsNdCommunityExplore} />
              <Route path="/facilities/goals" component={UsNdFacilitiesGoals} />
              <Route path="/facilities/explore" component={UsNdFacilitiesExplore} />
              <Route path="/programming/explore" component={UsNdProgrammingExplore} />
              <Route path="/profile" component={Profile} />
              <Redirect exact from="/" to="/community/goals" />
              <Redirect from="/snapshots" to="/community/goals" />
              <Redirect from="/revocations" to="/community/goals" />
              <Redirect from="/reincarcerations" to="/facilities/goals" />
              <Redirect from="/programEvaluation/freeThroughRecovery" to="/programming/explore" />
              <NotFound />
            </Switch>
          </UsNdLayout>

          <UsPaLayout stateCode={lanternTenant.PA}>
            <Switch>
              <Route path="/community/revocations" component={UsPaCommunityRevocations} />
              <Route path="/profile" component={Profile} />
              <Redirect exact from="/" to="/community/revocations" />
              <Redirect from="/revocations" to="/community/revocations" />
              <NotFound />
            </Switch>
          </UsPaLayout>
        </TenantRoutes>
      </Switch>
    </Router>
  </StateCodeProvider>
);

export default App;
