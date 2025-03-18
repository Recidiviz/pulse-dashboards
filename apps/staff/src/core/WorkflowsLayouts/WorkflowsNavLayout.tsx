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

import {
  PartiallyTypedRootStore,
  useRootStore,
} from "../../components/StoreProvider";
import useIsMobile from "../../hooks/useIsMobile";
import { NavigationBackButton } from "../NavigationBackButton";
import { NavigationLayout, OverviewNavLinks } from "../NavigationLayout";
import { MaxWidth } from "../sharedComponents";
import { WORKFLOWS_METHODOLOGY_URL } from "../utils/constants";
import { workflowsUrl } from "../views";

const Wrapper = styled.div`
  background-color: ${palette.marble1};
  min-height: 100vh;
  height: 100%;
  width: 100%;
`;

const Main = styled.main<{
  isMobile?: boolean;
  $limitedWidth: boolean;
}>`
  padding: ${({ isMobile }) =>
    isMobile
      ? `${rem(spacing.lg)} ${rem(spacing.md)}`
      : `${rem(spacing.xl)} ${rem(spacing.lg)}`}};

  /* leaving extra space for the Intercom button */
  padding-bottom: ${rem(spacing.md * 5)};
  height: calc(100% - ${rem(spacing.md * 5 + spacing.xl)});

  ${(props) =>
    props.$limitedWidth &&
    `
      grid-column: 2;
      margin: 0 auto;
        ${MaxWidth}`}
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

export const WorkflowsNavLayout: React.FC<{
  limitedWidth?: boolean;
  children?: React.ReactNode;
}> =
  // TODO(#5636) Eliminate PartiallyTypedRootStore
  observer(function WorkflowsNavLayout({ limitedWidth = true, children }) {
    const {
      currentTenantId,
      workflowsStore: {
        homepage: workflowsHomepage,
        activePageIsHomepage,
        activePageIsTasks,
      },
      tenantStore,
    } = useRootStore() as PartiallyTypedRootStore;
    const { isMobile, isLaptop } = useIsMobile(true);

    const workflowsMethodology = WORKFLOWS_METHODOLOGY_URL[currentTenantId];
    const tasksMethodology =
      tenantStore?.tasksConfiguration?.methodologyUrl ?? workflowsMethodology;

    return (
      <Wrapper>
        <NavigationLayout
          externalMethodologyUrl={
            activePageIsTasks ? tasksMethodology : workflowsMethodology
          }
        >
          <OverviewNavLinks />
        </NavigationLayout>
        {!activePageIsHomepage && (
          <BackButtonWrapper $fixed={!isLaptop && limitedWidth}>
            <NavigationBackButton
              action={{ url: workflowsUrl(workflowsHomepage) }}
            >
              Home
            </NavigationBackButton>
          </BackButtonWrapper>
        )}
        <Main isMobile={isMobile} $limitedWidth={limitedWidth}>
          {children}
        </Main>
      </Wrapper>
    );
  });
