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

import { spacing, typography } from "@recidiviz/design-system";
import { observer } from "mobx-react-lite";
import { rem } from "polished";
import React from "react";
import { Route, Routes } from "react-router-dom";
import styled from "styled-components";

import { palette } from "~design-system";

import NotFound from "../../components/NotFound";
import useIsMobile from "../../hooks/useIsMobile";
import {
  NAV_BAR_HEIGHT,
  NavigationLayout,
  OverviewNavLinks,
} from "../NavigationLayout";
import { MaxWidth } from "../sharedComponents";
import { paroleRoute } from "../views";
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
      : `${rem(spacing.xl)} ${rem(spacing.lg)}`};

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
`;

const PageParole: React.FC = observer(function PageParole() {
  window.scrollTo({ top: 0 });
  const { isMobile } = useIsMobile(true);

  return (
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
          <Route path="*" element={<NotFound />} />
        </Routes>
      </Main>
    </Wrapper>
  );
});

export default PageParole;
