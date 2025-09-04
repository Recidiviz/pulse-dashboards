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

import "./global.css";
import "@fontsource/public-sans/400.css";
import "@fontsource/public-sans/500.css";
import "@fontsource/public-sans/600.css";
import "@fontsource/public-sans/700.css";
import "@fontsource/libre-baskerville";

import {
  GlobalStyle as GlobalStyleBase,
  typography,
} from "@recidiviz/design-system";
import { ErrorBoundary, withSentryReactRouterV6Routing } from "@sentry/react";
import { Route, Routes } from "react-router-dom";
import styled, { createGlobalStyle } from "styled-components/macro";

import { NotFound } from "~@jii/common-ui";
import { initializeSentry, StoreProvider } from "~@jii/data";
import {
  AfterLogin,
  EdovoLandingPage,
  EmailVerification,
  OrijinSSOPage,
  SiteRoot,
  State,
  StateSelect,
} from "~@jii/paths";
import { palette } from "~design-system";

import { ErrorPage } from "../ErrorPage/ErrorPage";
import { GenericLayoutRoute } from "../GenericLayoutRoute/GenericLayoutRoute";
import { PageAfterLogin } from "../pages/PageAfterLogin";
import { PageEdovoLanding } from "../pages/PageEdovoLanding";
import { PageHome } from "../pages/PageHome";
import { PageOrijinSSO } from "../pages/PageOrijinSSO";
import { PageResidentsRoot } from "../pages/PageResidentsRoot";
import { PageRoot } from "../pages/PageRoot";
import { PageSearch } from "../pages/PageSearch";
import { PageSelectState } from "../pages/PageSelectState";
import { PageSingleResidentRoot } from "../pages/PageSingleResidentRoot";
import { PageState } from "../pages/PageState";
import { PageVerifyEmail } from "../pages/PageVerifyEmail";
import { ResidentsLayoutRoute } from "../ResidentsLayoutRoute/ResidentsLayoutRoute";
import { StateSpecificRouter } from "../StateSpecificRouter/StateSpecificRouter";

const StyledApp = styled.div`
  /* these properties prevent full-bleed sections from messing up the page width */
  min-height: 100vh;
  overflow-x: clip;
`;

const GlobalStyle = createGlobalStyle`
  body {
    ${typography.Sans16}
    
    background: ${palette.white};
    color: ${palette.pine2};
  }
`;

initializeSentry();

// doing this once (at the root off all <Routes>) allows Sentry to trace client-side URLs
const SentryRoutes = withSentryReactRouterV6Routing(Routes);

export function App() {
  return (
    <ErrorBoundary fallback={ErrorPage}>
      <StoreProvider>
        <GlobalStyleBase />
        <GlobalStyle />
        <StyledApp>
          <SentryRoutes>
            <Route path={SiteRoot.path} element={<PageRoot />}>
              <Route index element={<PageHome />} />
              <Route path={State.path}>
                <Route index element={<PageState />} />
                <Route element={<PageResidentsRoot />}>
                  <Route element={<ResidentsLayoutRoute />}>
                    <Route
                      path={State.Resident.path}
                      element={<PageSingleResidentRoot />}
                    >
                      <Route index path="*" element={<StateSpecificRouter />} />
                    </Route>
                    <Route path={State.Search.path} element={<PageSearch />} />
                  </Route>
                </Route>
              </Route>
              <Route element={<GenericLayoutRoute />}>
                <Route
                  path={EmailVerification.path}
                  element={<PageVerifyEmail />}
                />
                <Route path={AfterLogin.path} element={<PageAfterLogin />} />
                <Route
                  path={EdovoLandingPage.path}
                  element={<PageEdovoLanding />}
                />
                <Route path={StateSelect.path} element={<PageSelectState />} />

                <Route path="*" element={<NotFound />} />
              </Route>
              <Route path={OrijinSSOPage.path} element={<PageOrijinSSO />} />
            </Route>
          </SentryRoutes>
        </StyledApp>
      </StoreProvider>
    </ErrorBoundary>
  );
}
