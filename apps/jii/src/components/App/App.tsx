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

import { palette } from "~design-system";

import { initializeSentry } from "../../apis/Sentry/initializeSentry";
import * as routes from "../../routes/routes";
import { EGTDataRouteContext } from "../../US_MA/earnedGoodTime/components/EGTDataContext/RouteContext";
import { PageDefinition } from "../../US_MA/earnedGoodTime/components/pages/PageDefinition";
import { PageEGT } from "../../US_MA/earnedGoodTime/components/pages/PageEGT";
import { PageIntro } from "../../US_MA/earnedGoodTime/components/pages/PageIntro";
import { EligibilityRouteContext } from "../EligibilityRouteContext/EligibilityRouteContext";
import { ErrorPage } from "../ErrorPage/ErrorPage";
import { GenericLayoutRoute } from "../GenericLayoutRoute/GenericLayoutRoute";
import { NotFound } from "../NotFound/NotFound";
import { OpportunityInfoPage } from "../OpportunityInfoPage/OpportunityInfoPage";
import { PageAfterLogin } from "../pages/PageAfterLogin";
import { PageEdovoLanding } from "../pages/PageEdovoLanding";
import { PageEligibilityHome } from "../pages/PageEligibilityHome";
import { PageHome } from "../pages/PageHome";
import { PageOpportunityComparison } from "../pages/PageOpportunityComparison";
import { PageOpportunityEligibility } from "../pages/PageOpportunityEligibility";
import { PageOpportunityEligibilityHome } from "../pages/PageOpportunityEligibilityHome";
import { PageOrijinSSO } from "../pages/PageOrijinSSO";
import { PageProgressInfoPage } from "../pages/PageProgressInfoPage";
import { PageResidentsRoot } from "../pages/PageResidentsRoot";
import { PageRoot } from "../pages/PageRoot";
import { PageSearch } from "../pages/PageSearch";
import { PageSelectState } from "../pages/PageSelectState";
import { PageSingleResidentHome } from "../pages/PageSingleResidentHome";
import { PageState } from "../pages/PageState";
import { PageVerifyEmail } from "../pages/PageVerifyEmail";
import { ReentryRedirect } from "../pages/ReentryRedirect";
import { ResidentsLayoutRoute } from "../ResidentsLayoutRoute/ResidentsLayoutRoute";
import { StoreProvider } from "../StoreProvider/StoreProvider";

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
            <Route path={routes.SiteRoot.path} element={<PageRoot />}>
              <Route index element={<PageHome />} />
              <Route path={routes.State.path}>
                <Route index element={<PageState />} />
                <Route element={<PageResidentsRoot />}>
                  <Route element={<ResidentsLayoutRoute />}>
                    <Route
                      path={routes.State.Resident.path}
                      element={<ReentryRedirect />}
                    >
                      <Route index element={<PageSingleResidentHome />} />
                      <Route
                        path={routes.State.Resident.Eligibility.path}
                        element={<EligibilityRouteContext />}
                      >
                        <Route index element={<PageEligibilityHome />} />
                        <Route
                          path={
                            routes.State.Resident.Eligibility.Opportunity.path
                          }
                          element={<PageOpportunityEligibility />}
                        >
                          <Route
                            index
                            element={<PageOpportunityEligibilityHome />}
                          />
                          <Route
                            path={
                              routes.State.Resident.Eligibility.Opportunity
                                .InfoPage.path
                            }
                            element={<OpportunityInfoPage />}
                          />
                        </Route>
                        <Route
                          path={
                            routes.State.Resident.Eligibility.Comparison.path
                          }
                          element={<PageOpportunityComparison />}
                        />
                      </Route>
                      <Route
                        path={routes.State.Resident.Progress.InfoPage.path}
                        element={<PageProgressInfoPage />}
                      />
                      <Route
                        path={routes.State.Resident.EGT.path}
                        element={<EGTDataRouteContext />}
                      >
                        <Route index element={<PageEGT />} />
                        <Route
                          path={routes.State.Resident.EGT.Intro.path}
                          element={<PageIntro />}
                        />
                        <Route
                          path={routes.State.Resident.EGT.Definition.path}
                          element={<PageDefinition />}
                        />
                      </Route>
                    </Route>
                    <Route
                      path={routes.State.Search.path}
                      element={<PageSearch />}
                    />
                  </Route>
                </Route>
              </Route>
              <Route element={<GenericLayoutRoute />}>
                <Route
                  path={routes.EmailVerification.path}
                  element={<PageVerifyEmail />}
                />
                <Route
                  path={routes.AfterLogin.path}
                  element={<PageAfterLogin />}
                />
                <Route
                  path={routes.EdovoLandingPage.path}
                  element={<PageEdovoLanding />}
                />
                <Route
                  path={routes.StateSelect.path}
                  element={<PageSelectState />}
                />

                <Route path="*" element={<NotFound />} />
              </Route>
              <Route
                path={routes.OrijinSSOPage.path}
                element={<PageOrijinSSO />}
              />
            </Route>
          </SentryRoutes>
        </StyledApp>
      </StoreProvider>
    </ErrorBoundary>
  );
}
