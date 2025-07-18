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

import { Icon, IconSVG, spacing, typography } from "@recidiviz/design-system";
import { rem } from "polished";
import { useState } from "react";
import { Link } from "react-router-dom";
import useMeasure from "react-use-measure";
import styled from "styled-components/macro";

import { palette } from "~design-system";

import useIsMobile from "../../hooks/useIsMobile";

const Wrapper = styled.div<{
  isClickable?: boolean;
}>`
  background: ${palette.marble1};
  padding: ${rem(spacing.md)};
  box-shadow: unset;
  border: 1px solid ${palette.slate30};
  border-radius: ${rem(spacing.xs)};

  ${({ isClickable }) =>
    isClickable && `&:hover { border-color: ${palette.signal.links} }`}
`;

const Header = styled.div`
  display: flex;
  align-items: start;
  justify-content: space-between;
  gap: ${rem(spacing.xs)};
`;

const Title = styled.div`
  ${typography.Sans16}
  color: ${palette.pine1};
`;

const TitleWrapper = styled.div`
  display: flex;
  flex-flow: row nowrap;
  gap: ${rem(spacing.xs)};
`;

const Subtitle = styled.div`
  ${typography.Sans14}
  color: ${palette.slate85};
  padding-top: ${rem(spacing.xs)};
  line-height: 19.6px;
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
  margin-left: ${rem(spacing.xs)};
`;

const Content = styled.div`
  padding: ${rem(spacing.lg)} 0 0;
`;

type InsightsChartCardType = {
  title: string;
  subtitle?: string;
  infoModal?: React.ReactElement;
  url?: string;
  rate?: string;
  children?: React.ReactNode;
};

const InsightsChartCard: React.FC<InsightsChartCardType> = ({
  title,
  subtitle,
  infoModal,
  url,
  rate,
  children,
}) => {
  const { isMobile } = useIsMobile(true);
  const [ref, bounds] = useMeasure();
  const [isHovered, setHovered] = useState(false);

  const showHint = url && isHovered && !isMobile && bounds.width > 400;

  const cardViz = (
    <Wrapper
      ref={ref}
      isClickable={!!url}
      onMouseOver={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
    >
      <Header>
        <TitleWrapper>
          <Title>
            <div style={{ display: "flex", flexDirection: "row" }}>
              {title}
              {infoModal && <Hint>{infoModal}</Hint>}
              {rate && (
                <>
                  : <Rate>{rate}</Rate>
                </>
              )}
            </div>
            {subtitle && <Subtitle>{subtitle}</Subtitle>}
          </Title>
        </TitleWrapper>
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

      <Content>{children}</Content>
    </Wrapper>
  );

  return url ? <Link to={url}>{cardViz}</Link> : cardViz;
};

export default InsightsChartCard;
