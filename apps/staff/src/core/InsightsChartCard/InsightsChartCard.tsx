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
import { rem } from "polished";
import styled from "styled-components/macro";

import { InsightsLegend } from "../InsightsLegend";

const Wrapper = styled.div`
  background: ${palette.marble1};
  padding: ${rem(spacing.lg)};
  box-shadow: 0px 0px 2px 0px rgba(0, 0, 0, 0.35) inset;
  border-radius: ${rem(spacing.xs)};
`;

const Header = styled.div`
  display: flex;
  flex-direction: column;
  gap: ${rem(spacing.sm)};
`;

const Title = styled.div`
  display: flex;
  gap: ${rem(spacing.xs)};
  ${typography.Sans16}
  color: ${palette.pine1};
`;

const Subtitle = styled.div`
  color: ${palette.slate85};
`;

const Content = styled.div`
  padding: ${rem(spacing.lg)} 0 ${rem(spacing.md)};
`;

type InsightsChartCardType = {
  title: string;
  subtitle?: string;
  hasLegend?: boolean;
  infoModal?: React.ReactElement;
  children?: React.ReactNode;
};

const InsightsChartCard: React.FC<InsightsChartCardType> = ({
  title,
  subtitle,
  infoModal,
  hasLegend = true,
  children,
}) => {
  return (
    <Wrapper>
      <Header>
        <Title>
          {title}
          {infoModal}
        </Title>
        {subtitle && <Subtitle>{subtitle}</Subtitle>}
      </Header>
      <Content>{children}</Content>
      {hasLegend && <InsightsLegend direction="row" />}
    </Wrapper>
  );
};

export default InsightsChartCard;
