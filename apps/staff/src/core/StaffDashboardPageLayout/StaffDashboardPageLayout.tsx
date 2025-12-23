// Recidiviz - a data platform for criminal justice reform
// Copyright (C) 2025 Recidiviz, Inc.
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
import { rem } from "polished";
import React from "react";
import styled from "styled-components";

import { palette } from "~design-system";

import useIsMobile from "../../hooks/useIsMobile";
import { NavigationLayout } from "../NavigationLayout";

const Wrapper = styled.div`
  min-height: 100vh;
  width: 100%;
  display: flex;
  flex-direction: column;
  background-color: ${palette.marble1};
  ${typography.Sans14};
`;

const Main = styled.main<{
  isMobile: boolean;
  hasPadding?: boolean;
}>`
  display: flex;
  flex-direction: column;
  flex: auto;
  padding: ${({ isMobile }) =>
    isMobile ? `${rem(spacing.lg)} ${rem(spacing.md)}` : `${rem(spacing.lg)}`};
  ${({ hasPadding }) => !hasPadding && `padding: 0 !important;`}
`;

type StaffDashboardPageLayoutProps = {
  children: React.ReactNode;
  hasPadding?: boolean;
};

export const StaffDashboardPageLayout: React.FC<
  StaffDashboardPageLayoutProps
> = ({ children, hasPadding }) => {
  const { isMobile } = useIsMobile(true);

  return (
    <Wrapper>
      <NavigationLayout />
      <Main isMobile={isMobile} hasPadding={hasPadding}>
        {children}
      </Main>
    </Wrapper>
  );
};
