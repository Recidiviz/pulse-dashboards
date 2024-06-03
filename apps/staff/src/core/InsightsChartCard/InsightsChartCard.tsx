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

import {
  Icon,
  IconSVG,
  palette,
  spacing,
  typography,
} from "@recidiviz/design-system";
import { rem } from "polished";
import { useState } from "react";
import { Link } from "react-router-dom";
import useMeasure from "react-use-measure";
import styled from "styled-components/macro";

import { useFeatureVariants } from "../../components/StoreProvider";
import useIsMobile from "../../hooks/useIsMobile";
import { InsightsLegend } from "../InsightsLegend";

const Wrapper = styled.div<{
  isClickable?: boolean;
  supervisorHomepage?: boolean;
}>`
  background: ${palette.marble1};
  padding: ${({ supervisorHomepage }) =>
    supervisorHomepage ? rem(spacing.md) : rem(spacing.lg)};
  box-shadow: ${({ supervisorHomepage }) =>
    supervisorHomepage ? "unset" : "0px 0px 2px 0px rgba(0, 0, 0, 0.35) inset"};
  border: ${({ supervisorHomepage }) =>
    supervisorHomepage ? `1px solid ${palette.slate30}` : "unset"};
  border-radius: ${rem(spacing.xs)};

  ${({ isClickable }) =>
    isClickable && `&:hover { border-color: ${palette.signal.links} }`}
`;

const Header = styled.div<{ supervisorHomepage?: boolean }>`
  display: flex;
  align-items: start;
  justify-content: ${({ supervisorHomepage }) =>
    supervisorHomepage ? "space-between" : "unset"};
  gap: ${rem(spacing.xs)};
`;

const Title = styled.div`
  ${typography.Sans16}
  color: ${palette.pine1};
`;

const Subtitle = styled.div`
  ${typography.Sans14}
  color: ${palette.slate85};
  padding-top: ${rem(spacing.xs)};
`;

const Hint = styled.div<{ isClickable?: boolean }>`
  display: flex;
  align-items: center;
  color: ${({ isClickable }) =>
    isClickable ? palette.signal.links : palette.slate85};

  &:not(:first-child) > svg {
    margin-left: ${rem(spacing.sm)};
  }
`;

const Rate = styled.span`
  color: ${palette.signal.error};
  font-weight: 700;
`;

const Content = styled.div<{ supervisorHomepage?: boolean }>`
  padding: ${rem(spacing.lg)} 0
    ${({ supervisorHomepage }) => (supervisorHomepage ? 0 : rem(spacing.md))};
`;

type InsightsChartCardType = {
  title: string;
  subtitle?: string;
  hasLegend?: boolean;
  infoModal?: React.ReactElement;
  url?: string;
  rate?: string;
  outcomeType?: "FAVORABLE" | "ADVERSE";
  children?: React.ReactNode;
};

const InsightsChartCard: React.FC<InsightsChartCardType> = ({
  title,
  subtitle,
  infoModal,
  hasLegend = true,
  outcomeType = "ADVERSE",
  url,
  rate,
  children,
}) => {
  const { isMobile } = useIsMobile(true);
  const [ref, bounds] = useMeasure();
  const { supervisorHomepage } = useFeatureVariants();
  const [isHovered, setHovered] = useState(false);

  const showHint = url && isHovered && !isMobile && bounds.width > 400;

  const cardViz = (
    <Wrapper
      ref={ref}
      isClickable={!!url}
      supervisorHomepage={!!supervisorHomepage}
      onMouseOver={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
    >
      <Header supervisorHomepage={!!supervisorHomepage}>
        <Title>
          {title}
          {rate && (
            <>
              : <Rate>{rate}</Rate>
            </>
          )}
          {subtitle && <Subtitle>{subtitle}</Subtitle>}
        </Title>
        {infoModal && <Hint>{infoModal}</Hint>}
        {showHint && (
          <Hint isClickable={!!url}>
            See more
            <Icon
              kind={IconSVG.Arrow}
              fill={palette.signal.links}
              height={16}
              width={16}
            />
          </Hint>
        )}
      </Header>

      <Content supervisorHomepage={!!supervisorHomepage}>{children}</Content>
      {!supervisorHomepage && hasLegend && (
        <InsightsLegend direction="row" outcomeType={outcomeType} />
      )}
    </Wrapper>
  );

  return url ? <Link to={url}>{cardViz}</Link> : cardViz;
};

export default InsightsChartCard;
