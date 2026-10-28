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
import { Route, Routes, useLocation, useMatch } from "react-router-dom";
import styled from "styled-components";

import { palette } from "~design-system";

import NotFound from "../../components/NotFound";
import { useRootStore } from "../../components/StoreProvider";
import useIsMobile from "../../hooks/useIsMobile";
import {
  NAV_BAR_HEIGHT,
  NavigationLayout,
  OverviewNavLinks,
} from "../NavigationLayout";
import { MaxWidth } from "../sharedComponents";
import { PAROLE_PATHS, paroleRoute } from "../views";
import { ParoleCaseProfile } from "./ParoleCaseProfile";
import { ParoleDocketView } from "./ParoleDocketView";
import { ParolePublicCalendar } from "./ParolePublicCalendar";
import { ParoleResidentsView } from "./ParoleResidentsView";

const Wrapper = styled.div<{ $backgroundColor: string }>`
  ${typography.Sans14};
  background-color: ${({ $backgroundColor }) => $backgroundColor};
  min-height: 100vh;
  width: 100%;
`;

const Main = styled.main<{
  isMobile?: boolean;
  $isFullWidth: boolean;
  $isFlush: boolean;
}>`
  display: flex;
  flex-direction: column;
  flex: auto;

  padding: ${({ $isFlush }) => ($isFlush ? 0 : "2rem 1.5rem 5rem")};

  height: ${({ isMobile }) =>
    isMobile
      ? `calc(100% - ${rem(spacing.lg + NAV_BAR_HEIGHT)})`
      : `calc(100% - ${rem(spacing.md * 5 + spacing.xl)})`};

  margin: 0 auto;
  ${({ $isFullWidth }) => !$isFullWidth && MaxWidth}
`;

const PageParole: React.FC = observer(function PageParole() {
  const { isMobile } = useIsMobile(true);
  const { pathname } = useLocation();
  const {
    userStore: { userAllowedNavigation },
  } = useRootStore();
  // A user granted only the Public Calendar still has a parole navigation
  // entry, which lets every /parole path through DashboardLayout. Case
  // profiles open from the docket, so they need it, like the Parole nav link.
  const canViewCases = (userAllowedNavigation?.parole ?? []).includes("docket");
  const isCaseProfile = useMatch(PAROLE_PATHS.caseProfile) !== null;
  const isDocket = useMatch(PAROLE_PATHS.docket) !== null;
  // Each state's Public Calendar lays out its own page, so it gets no padding
  // or max width.
  const isPublicCalendar =
    useMatch(`${PAROLE_PATHS.publicCalendar}/*`) !== null;
  const backgroundColor = isCaseProfile ? palette.marble3 : palette.marble1;

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
      <Wrapper $backgroundColor={backgroundColor}>
        <NavigationLayout>
          <OverviewNavLinks />
        </NavigationLayout>
        <Main
          isMobile={isMobile}
          $isFullWidth={isDocket || isPublicCalendar}
          $isFlush={isPublicCalendar}
        >
          <Routes>
            <Route
              path={paroleRoute({ routeName: "docket" })}
              element={<ParoleDocketView />}
            />
            <Route
              path={paroleRoute({ routeName: "residents" })}
              element={<ParoleResidentsView />}
            />
            <Route
              path={`${paroleRoute({ routeName: "publicCalendar" })}/*`}
              element={<ParolePublicCalendar />}
            />
            {canViewCases && (
              <Route
                path={paroleRoute({ routeName: "caseProfile" })}
                element={<ParoleCaseProfile />}
              />
            )}
            <Route path="*" element={<NotFound />} />
          </Routes>
        </Main>
      </Wrapper>
    </ErrorBoundary>
  );
});

export default PageParole;
