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

import { palette, spacing, zindex } from "@recidiviz/design-system";
import { observer } from "mobx-react-lite";
import { rem } from "polished";
import React from "react";
import styled from "styled-components/macro";

import { useRootStore } from "../../components/StoreProvider";
import useIsMobile from "../../hooks/useIsMobile";
import cssVars from "../CoreConstants.module.scss";
import { NavigationBackButton } from "../NavigationBackButton";
import { NavigationLayout, OverviewNavLinks } from "../NavigationLayout";
import { WORKFLOWS_METHODOLOGY_URL } from "../utils/constants";
import { workflowsUrl } from "../views";

const Wrapper = styled.div`
  background-color: ${palette.marble1};
  min-height: 100vh;
  width: 100%;
`;

const Main = styled.main<{
  isMobile?: boolean;
}>`
  grid-column: 2;
  padding-right: ${rem(spacing.md)};
  padding-top: ${rem(spacing.sm)};
  /* leaving extra space for the Intercom button */
  padding-bottom: ${rem(spacing.md * 4)};

  max-width: 75vw;
  margin: 0 auto;
  padding: ${({ isMobile }) =>
    isMobile
      ? `${rem(spacing.lg)} ${rem(spacing.md)}`
      : `${rem(spacing.xl)} ${rem(spacing.lg)}`};
  padding-bottom: ${rem(spacing.md * 5)};

  @media screen and (max-width: ${cssVars.breakpointSxs}) {
    max-width: 90vw;
  }

  @media screen and (max-width: ${cssVars.breakpointXs}) {
    max-width: unset;
  }
`;

const BackButtonWrapper = styled.div<{ $fixed: boolean }>`
  padding: ${rem(spacing.lg)};
  padding-bottom: 0;
  ${(props) =>
    props.$fixed
      ? `
        
        position: fixed;
        top: 4rem;
        z-index: ${zindex.tooltip - 2};
        `
      : ""}
`;

export const WorkflowsNavLayout: React.FC<{ children?: React.ReactNode }> =
  observer(function WorkflowsNavLayout({ children }) {
    const {
      currentTenantId,
      workflowsStore: { homepage: workflowsHomepage, activePageIsHomepage },
    } = useRootStore();
    const { isMobile, isLaptop } = useIsMobile(true);

    return (
      <Wrapper>
        <NavigationLayout
          externalMethodologyUrl={WORKFLOWS_METHODOLOGY_URL[currentTenantId]}
        >
          <OverviewNavLinks />
        </NavigationLayout>
        {!activePageIsHomepage && (
          <BackButtonWrapper $fixed={!isLaptop}>
            <NavigationBackButton
              action={{ url: workflowsUrl(workflowsHomepage) }}
            >
              Home
            </NavigationBackButton>
          </BackButtonWrapper>
        )}
        <Main isMobile={isMobile}>{children}</Main>
      </Wrapper>
    );
  });
