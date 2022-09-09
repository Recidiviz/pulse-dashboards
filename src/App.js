// Recidiviz - a data platform for criminal justice reform
// Copyright (C) 2019 Recidiviz, Inc.
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

import React, { useEffect, useState } from 'react';
import {
  BrowserRouter as Router, Redirect, Route, Switch,
} from 'react-router-dom';

import * as $ from 'jquery';
import { useAuth0 } from './react-auth0-spa';

import Footer from './components/Footer';
import Loading from './components/Loading';
import PrivateRoute from './components/PrivateRoute';
import PrivateTenantRoute from './components/PrivateTenantRoute';
import SideBar from './components/SideBar';
import TopBar from './components/TopBar';
import { getUserStateCode } from './utils/authentication/user';
import { hasSideBar } from './utils/layout/filters';
import NotFound from './views/NotFound';
import Profile from './views/Profile';
import VerificationNeeded from './views/VerificationNeeded';
import { getLandingViewForState } from './views/stateViews';
import './assets/scripts/index';

// styles
import './assets/styles/index.scss';

// fontawesome
import initFontAwesome from './utils/initFontAwesome';

initFontAwesome();

const App = () => {
  const [sideBarCollapsed, setSideBarCollapsed] = useState('');
  const { user, loading, isAuthenticated } = useAuth0();

  function toggleCollapsed() {
    const currentlyCollapsed = sideBarCollapsed === 'is-collapsed';
    if (currentlyCollapsed) {
      setSideBarCollapsed('');
    } else {
      setSideBarCollapsed('is-collapsed');
    }
  }

  // TODO: Replace this jQuery with actual React toggle components
  useEffect(() => {
    // ٍSidebar Toggle
    $('.sidebar-toggle').on('click', (e) => {
      toggleCollapsed();
      e.preventDefault();
    });

    /**
     * Wait until sidebar fully toggled (animated in/out)
     * then trigger window resize event in order to recalculate
     * masonry layout widths and gutters.
     */
    $('#sidebar-toggle').click((e) => {
      e.preventDefault();
      setTimeout(() => {
        window.dispatchEvent(window.EVENT);
      }, 300);
    });
  });

  if (loading) {
    return <Loading />;
  }

  // This lets us retrieve the state code for the user only after we have authenticated
  const shouldLoadSidebar = (authenticated) => {
    if (!authenticated) {
      return false;
    }

    const stateCode = getUserStateCode(user);
    return hasSideBar(stateCode, authenticated);
  };

  // This lets us retrieve the state code for the user only after we have authenticated
  const getLandingView = (authenticated) => {
    if (!authenticated) {
      return '/revocations';
    }

    const stateCode = getUserStateCode(user);
    return getLandingViewForState(stateCode);
  };

  let containerClass = 'wide-page-container';
  if (shouldLoadSidebar(isAuthenticated)) {
    containerClass = 'page-container';
  }

  return (
    <Router>
      <div id="app" className={sideBarCollapsed}>
        <div>
          <meta charSet="utf-8" />
          <meta name="viewport" content="width=device-width, initial-scale=1, shrink-to-fit=no" />
          <title>Recidiviz Dashboard</title>
          <div>
            {shouldLoadSidebar(isAuthenticated) && (
            <SideBar />
            )}
            <div className={containerClass}>
              <TopBar pathname={window.location.pathname} />
              <Switch>
                <Route exact path="/">
                  <Redirect to={getLandingView(isAuthenticated)} />
                </Route>
                <PrivateTenantRoute path="/snapshots" />
                <PrivateTenantRoute path="/revocations" />
                <PrivateTenantRoute path="/reincarcerations" />
                <PrivateTenantRoute path="/programEvaluation/freeThroughRecovery" />

                {/* start new routes without links */}
                <PrivateTenantRoute path="/community/goals" />
                <PrivateTenantRoute path="/community/explore" />
                <PrivateTenantRoute path="/facilities/goals" />
                <PrivateTenantRoute path="/facilities/explore" />
                <PrivateTenantRoute path="/programming/explore" />
                {/* end new routes without links */}

                <PrivateRoute path="/profile" component={Profile} />
                <Route path="/verify" component={VerificationNeeded} />
                <Route component={NotFound} />
              </Switch>
              <Footer />
            </div>
          </div>
        </div>
      </div>
    </Router>
  );
};

export default App;
