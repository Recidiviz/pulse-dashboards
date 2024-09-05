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
  palette,
  typography,
} from "@recidiviz/design-system";
import { ErrorBoundary, withSentryReactRouterV6Routing } from "@sentry/react";
import { Route, Routes } from "react-router-dom";
import styled, { createGlobalStyle } from "styled-components/macro";

import { initializeSentry } from "../../apis/Sentry/initializeSentry";
import { ErrorPage } from "../ErrorPage/ErrorPage";
import { NotFound } from "../NotFound/NotFound";
import { PageAfterLogin } from "../pages/PageAfterLogin";
import { PageEligibility } from "../pages/PageEligibility";
import { PageEligibilityHome } from "../pages/PageEligibilityHome";
import { PageHome } from "../pages/PageHome";
import { PageLanding } from "../pages/PageLanding";
import { PageOpportunityEligibility } from "../pages/PageOpportunityEligibility";
import { PageRoot } from "../pages/PageRoot";
import { PageSearch } from "../pages/PageSearch";
import { PageStateLanding } from "../pages/PageStateLanding";
import { PageVerifyEmail } from "../pages/PageVerifyEmail";
import { StaticPage } from "../StaticPage/StaticPage";
import { StoreProvider } from "../StoreProvider/StoreProvider";

const StyledApp = styled.div``;

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
    <ErrorBoundary showDialog fallback={ErrorPage}>
      <StoreProvider>
        <GlobalStyleBase />
        <GlobalStyle />

        <StyledApp>
          <SentryRoutes>
            <Route path="/" element={<PageRoot />}>
              <Route index element={<PageHome />} />
              <Route path="welcome" element={<PageLanding />} />
              <Route path=":landingPageUrl" element={<PageStateLanding />} />
              <Route path="verify" element={<PageVerifyEmail />} />
              <Route path="after-login" element={<PageAfterLogin />} />
              <Route path="eligibility" element={<PageEligibility />}>
                <Route index element={<PageEligibilityHome />} />
                <Route path="search" element={<PageSearch />} />
                <Route path=":opportunityUrl">
                  <Route index element={<PageOpportunityEligibility />} />
                  <Route path="about" element={<StaticPage pageId="about" />} />
                  <Route
                    path="requirements"
                    element={<StaticPage pageId="requirements" />}
                  />
                  <Route
                    path="next-steps"
                    element={<StaticPage pageId="nextSteps" />}
                  />
                </Route>
              </Route>
              <Route path="*" element={<NotFound />} />
            </Route>
          </SentryRoutes>
        </StyledApp>
      </StoreProvider>
    </ErrorBoundary>
  );
}
