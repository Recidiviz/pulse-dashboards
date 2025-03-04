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

import { palette, spacing, typography } from "@recidiviz/design-system";
import { observer } from "mobx-react-lite";
import { rem } from "polished";
import React, { ReactNode } from "react";
import styled from "styled-components/macro";

import useIsMobile from "../../hooks/useIsMobile";
import { StyledLink } from "../InsightsInfoModal/InsightsInfoModal";
import {
  Header,
  Subtitle,
  Wrapper,
} from "../InsightsPageLayout/InsightsPageLayout";

const Title = styled(Subtitle)`
  margin-top: 0;
`;

const SectionWrapper = styled.div`
  display: flex;
  flex-direction: column;
  gap: ${rem(spacing.lg)};
  padding: 0;
  margin-bottom: 40px;
`;

const Description = styled.div`
  max-width: ${rem(700)};
  ${typography.Sans14};
  color: ${palette.slate85};
  margin-top: ${rem(spacing.sm)};
`;

type InsightsPageSectionProps = {
  sectionTitle?: string;
  sectionDescription?: ReactNode | string;
  methodologyLink?: string;
  methodologyLinkCta?: string;
  children?: ReactNode;
};

const InsightsPageSection: React.FC<InsightsPageSectionProps> = ({
  sectionTitle,
  sectionDescription,
  methodologyLinkCta,
  methodologyLink,
  children,
}) => {
  const { isLaptop } = useIsMobile(true);

  return (
    <SectionWrapper>
      <Wrapper isLaptop={isLaptop}>
        <Header>
          <Title>{sectionTitle}</Title>
          {(methodologyLink || methodologyLinkCta || sectionDescription) && (
            <Description>
              {sectionDescription}{" "}
              {methodologyLink && (
                <StyledLink to={methodologyLink} target="_blank">
                  {methodologyLinkCta || "See Full Methodology"}
                </StyledLink>
              )}
            </Description>
          )}
        </Header>
      </Wrapper>
      {children}
    </SectionWrapper>
  );
};

export default observer(InsightsPageSection);
