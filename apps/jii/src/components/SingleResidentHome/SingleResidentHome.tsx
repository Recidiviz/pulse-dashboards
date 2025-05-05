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

import { palette, spacing, typography } from "@recidiviz/design-system";
import { rem } from "polished";
import { memo } from "react";
import styled from "styled-components/macro";

import { useResidentsContext } from "../ResidentsHydrator/context";
import { Eligibility } from "./Eligibility";
import { Footer } from "./Footer";
import { Progress } from "./Progress";

const Wrapper = styled.div`
  display: flex;
  flex-direction: column;
  justify-content: space-between;
  align-items: stretch;
  min-height: 100%;
`;

const SectionsWrapper = styled.div`
  row-gap: ${rem(spacing.xxl * 2)};
  display: grid;
`;

const HEADER_COLUMN_WIDTH = 150;
const STACKING_BREAKPOINT = HEADER_COLUMN_WIDTH * 4;

const SectionModule = styled.article`
  @media (min-width: ${STACKING_BREAKPOINT}px) {
    column-gap: ${rem(spacing.xl)};
    display: grid;
    grid-template-columns: ${rem(HEADER_COLUMN_WIDTH)} 1fr;
  }
`;

const ModuleHeading = styled.h2`
  ${typography.Sans16}

  color: ${palette.pine1};
  margin: 0 0 ${rem(spacing.lg)};
`;

export const SingleResidentHome = memo(function SingleResidentHome() {
  const {
    residentsStore: {
      config: { progress, eligibility },
    },
  } = useResidentsContext();

  return (
    <Wrapper>
      <SectionsWrapper>
        {progress && (
          <SectionModule>
            <ModuleHeading>{progress.home.title}</ModuleHeading>
            <Progress config={progress} />
          </SectionModule>
        )}
        {eligibility && (
          <SectionModule>
            <ModuleHeading>{eligibility.home.title}</ModuleHeading>
            <Eligibility config={eligibility} />
          </SectionModule>
        )}
      </SectionsWrapper>
      <Footer />
    </Wrapper>
  );
});
