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

import { useRootStore } from "../../components/StoreProvider";
import useIsMobile from "../../hooks/useIsMobile";
import {
  Header,
  Subtitle as Title,
  Wrapper,
} from "../InsightsPageLayout/InsightsPageLayout";

const SectionWrapper = styled.div`
  display: flex;
  flex-direction: column;
  gap: ${rem(spacing.md)};
  padding: 0;
`;

const Description = styled.div`
  max-width: ${rem(700)};
  ${typography.Sans14};
  color: ${palette.slate85};
  margin-top: ${rem(spacing.md)};
`;

type InsightsPageSectionProps = {
  sectionTitle?: string;
  sectionDescription?: ReactNode | string;

  children?: ReactNode;
};

const InsightsPageSection: React.FC<InsightsPageSectionProps> = ({
  sectionTitle,
  sectionDescription,
  children,
}) => {
  const { isLaptop } = useIsMobile(true);

  const {
    insightsStore: { shouldUseSupervisorHomepageUI: supervisorHomepage },
  } = useRootStore();

  return (
    <SectionWrapper>
      <Wrapper isLaptop={isLaptop} supervisorHomepage={supervisorHomepage}>
        <Header>
          <Title>{sectionTitle}</Title>
          {supervisorHomepage && sectionDescription && (
            <Description>{sectionDescription}</Description>
          )}
        </Header>
      </Wrapper>
      {children}
    </SectionWrapper>
  );
};

export default observer(InsightsPageSection);
