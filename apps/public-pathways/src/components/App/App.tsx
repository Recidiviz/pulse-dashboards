// Recidiviz - a data platform for criminal justice reform
// Copyright (C) 2026 Recidiviz, Inc.
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

import { GlobalStyle as GlobalStyleBase } from "@recidiviz/design-system";
import { ErrorBoundary, withSentryReactRouterV6Routing } from "@sentry/react";
import { Navigate, Route, Routes } from "react-router-dom";
import styled, { createGlobalStyle, ThemeProvider } from "styled-components";
import { QueryParamProvider } from "use-query-params";
import { ReactRouter6Adapter } from "use-query-params/adapters/react-router-6";

import { initializeSentry } from "../../initializeSentry";
import { publicPathwaysPalette } from "../../styles/publicPathwaysPalette";
import { publicPathwaysTheme } from "../../styles/publicPathwaysTheme";
import { publicPathwaysTypography } from "../../styles/publicPathwaysTypography";
import { PageMethodology } from "../pages/PageMethodology";
import { PagePublicPathways } from "../pages/PagePublicPathways";
import { PageRoot } from "../pages/PageRoot";
import { StoreProvider } from "../StoreProvider";
import { PublicPathwaysLayout } from "./PublicPathwaysLayout";

const StyledApp = styled.div`
  /* these properties prevent full-bleed sections from messing up the page width */
  min-height: 100vh;
  overflow-x: clip;
`;

const GlobalStyle = createGlobalStyle`
  body {
    ${publicPathwaysTypography.Sans16}

    background: ${publicPathwaysPalette.white};
    color: black;
  }

  a {
    color: ${({ theme }) => theme.palette.signal.links};
  }
`;

initializeSentry();

// doing this once (at the root off all <Routes>) allows Sentry to trace client-side URLs
const SentryRoutes = withSentryReactRouterV6Routing(Routes);

export function App() {
  return (
    <ErrorBoundary>
      <StoreProvider>
        <ThemeProvider theme={publicPathwaysTheme}>
          <GlobalStyleBase />
          <GlobalStyle />
          <StyledApp>
            <QueryParamProvider adapter={ReactRouter6Adapter}>
              <SentryRoutes>
                <Route path="/" element={<PageRoot />}>
                  <Route index element={<Navigate to="/prison" replace />} />
                  <Route element={<PublicPathwaysLayout />}>
                    <Route path="methodology" element={<PageMethodology />} />
                    <Route path=":pageId" element={<PagePublicPathways />} />
                  </Route>
                </Route>
              </SentryRoutes>
            </QueryParamProvider>
          </StyledApp>
        </ThemeProvider>
      </StoreProvider>
    </ErrorBoundary>
  );
}
