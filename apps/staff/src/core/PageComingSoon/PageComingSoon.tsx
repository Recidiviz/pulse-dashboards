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

import { observer } from "mobx-react-lite";
import { rem } from "polished";
import React from "react";
import styled from "styled-components";

import { palette, spacing, typography } from "~design-system";

import { NAV_BAR_HEIGHT, NavigationLayout } from "../NavigationLayout";

const Wrapper = styled.div`
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  height: calc(100vh - ${rem(NAV_BAR_HEIGHT)});
  padding: ${rem(spacing.xl)};
  text-align: center;
`;

const Title = styled.h1`
  ${typography.Serif24}

  color: ${palette.pine1};
  margin-bottom: ${rem(spacing.sm)};
`;

const Subtitle = styled.p`
  ${typography.Sans16}

  color: ${palette.slate70};
`;

const PageComingSoon: React.FC = observer(function PageComingSoon() {
  return (
    <>
      <NavigationLayout />
      <Wrapper>
        <Title>Coming soon</Title>
        <Subtitle>
          This dashboard is under construction. Check back soon.
        </Subtitle>
      </Wrapper>
    </>
  );
});

export default PageComingSoon;
