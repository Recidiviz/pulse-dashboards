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

import { FullBleedContainer, PageContainer } from "../BaseLayout/BaseLayout";
import { CopyWrapper } from "../CopyWrapper/CopyWrapper";
import { useResidentsContext } from "../ResidentsHydrator/context";
import { Eligibility } from "./Eligibility";
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

const SectionModule = styled.article`
  column-gap: ${rem(spacing.xl)};
  display: grid;
  grid-template-columns: ${rem(150)} 1fr;
`;

const ModuleHeading = styled.h2`
  ${typography.Sans16}

  color: ${palette.pine1};
`;

const Footer = styled(FullBleedContainer).attrs({ as: "footer" })`
  background-color: ${palette.pine1};
  color: ${palette.white80};
  padding: ${rem(spacing.lg)} 0;

  h2,
  p {
    ${typography.Sans12}

    margin: 0;
  }

  h2 {
    color: ${palette.white};
  }
`;

const FooterContents = styled(PageContainer)`
  display: flex;
  justify-content: space-between;

  & > :last-child {
    text-align: right;
  }
`;

export const SingleResidentHome = memo(function SingleResidentHome() {
  const {
    residentsStore: {
      config: {
        home: { eligibility, footer, progress },
      },
    },
  } = useResidentsContext();

  return (
    <Wrapper>
      <SectionsWrapper>
        <SectionModule>
          <ModuleHeading>{progress.title}</ModuleHeading>
          <Progress />
        </SectionModule>
        <SectionModule>
          <ModuleHeading>{eligibility.title}</ModuleHeading>
          <Eligibility />
        </SectionModule>
      </SectionsWrapper>
      <Footer>
        <FooterContents>
          <div>
            <h2>{footer.about.title}</h2>
            <CopyWrapper>{footer.about.body}</CopyWrapper>
          </div>
          <div>
            <h2>{footer.contact.title}</h2>
            <CopyWrapper>{footer.contact.body}</CopyWrapper>
          </div>
        </FooterContents>
      </Footer>
    </Wrapper>
  );
});
