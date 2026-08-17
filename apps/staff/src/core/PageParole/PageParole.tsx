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

import { ErrorPage, spacing, typography } from "@recidiviz/design-system";
import { ErrorBoundary } from "@sentry/react";
import { observer } from "mobx-react-lite";
import { rem } from "polished";
import React, { useEffect } from "react";
import { Route, Routes, useLocation } from "react-router-dom";
import styled from "styled-components";

import { palette } from "~design-system";

import NotFound from "../../components/NotFound";
import useIsMobile from "../../hooks/useIsMobile";
import cssVars from "../CoreConstants.module.scss";
import {
  NAV_BAR_HEIGHT,
  NavigationLayout,
  OverviewNavLinks,
} from "../NavigationLayout";
import { MaxWidth } from "../sharedComponents";
import { paroleRoute } from "../views";
import { ParoleCaseProfile } from "./ParoleCaseProfile";
import { ParoleDocketView } from "./ParoleDocketView";

const Wrapper = styled.div`
  ${typography.Sans14};
  background-color: ${palette.marble1};
  min-height: 100vh;
  max-height: 100vh;
  height: 100%;
  width: 100%;
`;

const Main = styled.main<{ isMobile?: boolean }>`
  display: flex;
  flex-direction: column;
  flex: auto;

  padding: ${({ isMobile }) =>
    isMobile
      ? `${rem(spacing.lg)} ${rem(spacing.md)}`
      : `${rem(spacing.xl)} ${rem(spacing.md)}`};

  /* leaving extra space for the Intercom button */
  ${({ isMobile }) =>
    isMobile
      ? `
      padding-bottom: ${rem(spacing.lg)};
      height: calc(100% - ${rem(spacing.lg + NAV_BAR_HEIGHT)});
  `
      : `padding-bottom: ${rem(spacing.md * 5)};
  height: calc(100% - ${rem(spacing.md * 5 + spacing.xl)});`}

  margin: 0 auto;
  ${MaxWidth}

  /* Parole's sidebar layout needs more horizontal room than the shared
  75vw cap gives the Workflows pages this mixin was designed for. */
  max-width: 92vw;

  @media screen and (max-width: ${cssVars.breakpointSm}) {
    max-width: 95vw;
  }
`;

const PageParole: React.FC = observer(function PageParole() {
  const { isMobile } = useIsMobile(true);
  const { pathname } = useLocation();

  useEffect(() => {
    window.scrollTo({ top: 0 });
  }, [pathname]);

  return (
    <ErrorBoundary
      fallback={
        <ErrorPage headerText="Sorry, it looks like something went wrong...">
          Please try refreshing the page or reach out to your contact at
          Recidiviz for more assistance.
        </ErrorPage>
      }
    >
      <Wrapper>
        <NavigationLayout>
          <OverviewNavLinks />
        </NavigationLayout>
        <Main isMobile={isMobile}>
          <Routes>
            <Route
              path={paroleRoute({ routeName: "docket" })}
              element={<ParoleDocketView />}
            />
            <Route
              path={paroleRoute({ routeName: "caseProfile" })}
              element={<ParoleCaseProfile />}
            />
            <Route path="*" element={<NotFound />} />
          </Routes>
        </Main>
      </Wrapper>
    </ErrorBoundary>
  );
});

export default PageParole;
