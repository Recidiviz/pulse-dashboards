// Recidiviz - a data platform for criminal justice reform
// Copyright (C) 2023 Recidiviz, Inc.
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

import { palette, spacing, typography } from "@recidiviz/design-system";
import { observer } from "mobx-react-lite";
import { rem } from "polished";
import React from "react";
import styled from "styled-components/macro";

import { useRootStore } from "../../components/StoreProvider";
import useIsMobile from "../../hooks/useIsMobile";
import { NavigationLayout } from "../NavigationLayout";

export const INTERCOM_HEIGHT = 64;

const Wrapper = styled.div`
  ${typography.Sans14};
  background-color: ${palette.marble1};
  min-height: 100vh;
  width: 100%;

  display: flex;
  flex-direction: column;
`;

const Main = styled.main<{
  isMobile: boolean;
}>`
  padding: ${({ isMobile }) =>
    isMobile ? `${rem(spacing.lg)} ${rem(spacing.md)}` : `${rem(spacing.lg)}`};

  /* leaving extra space for the Intercom button */
  padding-bottom: ${rem(INTERCOM_HEIGHT)};

  display: flex;
  flex-direction: column;
  flex: auto;
`;

const OutliersNavLayout: React.FC = ({ children }) => {
  const { isMobile } = useIsMobile(true);

  const {
    outliersStore: { supervisionStore },
  } = useRootStore();

  return (
    <Wrapper>
      <NavigationLayout
        externalMethodologyUrl={supervisionStore?.methodologyUrl}
      />

      <Main isMobile={isMobile}>{children}</Main>
    </Wrapper>
  );
};

export default observer(OutliersNavLayout);
