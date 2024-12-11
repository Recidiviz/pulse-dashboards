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

import { spacing } from "@recidiviz/design-system";
import { rem } from "polished";
import { memo } from "react";
import { Outlet } from "react-router-dom";
import styled from "styled-components/macro";

import { useSkipNav } from "../SkipNav/SkipNav";
import { ResidentsHeader } from "./ResidentsHeader/ResidentsHeader";

const Wrapper = styled.div`
  display: flex;
  flex-direction: column;
  gap: ${rem(spacing.xl)};
`;

export const ResidentsLayout = memo(function ResidentsLayout() {
  const { MainContent, SkipNav, SkipNavController } = useSkipNav();
  return (
    <SkipNavController>
      <SkipNav />
      <Wrapper>
        <ResidentsHeader />
        <MainContent>
          <Outlet />
        </MainContent>
      </Wrapper>
    </SkipNavController>
  );
});
