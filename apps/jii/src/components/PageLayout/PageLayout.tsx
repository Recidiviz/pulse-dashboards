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
import { FC, memo, ReactNode } from "react";
import styled from "styled-components/macro";

import { useSkipNav } from "../SkipNav/SkipNav";
import { PageHeader } from "./PageHeader";

const Wrapper = styled.div`
  display: flex;
  flex-direction: column;
  gap: ${rem(spacing.xl)};
  min-height: 100vh;

  /* these styles ensure the main content always fills at least 
  the remainder of the screen height, in case the content requires something
  to be pushed to the bottom of the page */
  & main {
    display: grid;
    flex: 1 1 auto;
    grid-template-rows: 1fr;
  }
`;

export const PageLayout: FC<{ header?: ReactNode; main: ReactNode }> = memo(
  function PageLayout({ header, main }) {
    const { MainContent, SkipNav, SkipNavController } = useSkipNav();
    return (
      <SkipNavController>
        <SkipNav />
        <Wrapper>
          <PageHeader>{header}</PageHeader>
          <MainContent>{main}</MainContent>
        </Wrapper>
      </SkipNavController>
    );
  },
);
