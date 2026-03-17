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

import { typography } from "@recidiviz/design-system";
import React from "react";
import styled from "styled-components";

const Wrapper = styled.div`
  .VizPathways__point {
    fill: ${({ theme }) => theme.palette.data.indigo1};
    r: 0.3rem;
    stroke: #fff;
    stroke-width: 2;
  }

  .VizPathways__historicalLine {
    stroke: ${({ theme }) => theme.palette.data.indigo1};
    stroke-width: 2;
  }

  .data-visualization {
    .axis-baseline {
      stroke: none;
    }

    .axis-label {
      fill: ${({ theme }) => theme.typography.axisLabel.color};
      font-family: ${({ theme }) => theme.typography.axisLabel.fontFamily};
      font-weight: ${({ theme }) => theme.typography.axisLabel.fontWeight};
      font-size: ${({ theme }) => theme.typography.axisLabel.fontSize};
      line-height: ${({ theme }) => theme.typography.axisLabel.lineHeight};
      letter-spacing: ${({ theme }) =>
        theme.typography.axisLabel.letterSpacing};
    }

    .axis.bottom {
      transform: translateY(18px);
      text {
        transform: rotate(-45deg) translate(-0.4rem, -0.4rem);
      }
    }

    .axis.left {
      transform: translateX(-4px);
    }
  }

  .background-graphics {
    .x.tick-line {
      stroke: none;
    }

    .y.tick-line {
      stroke: ${({ theme }) => theme.palette.slate20};
    }
  }

  .points:focus,
  .lines:focus,
  .pieces:focus {
    outline: none;
  }

  .annotation-layer {
    .uncertainty {
      fill: ${({ theme }) => theme.palette.data.indigo10};
    }

    .frame-hover {
      fill: ${({ theme }) => theme.palette.signal.tooltip};
      stroke: ${({ theme }) => theme.palette.signal.tooltip};
      r: 0.25rem;
    }
  }

  &:focus,
  &:focus-within,
  &:active {
    border: 2px solid ${({ theme }) => theme.palette.focusColor};
    border-radius: 8px;
  }
`;

const Header = styled.div`
  display: flex;
  flex-wrap: wrap;
  justify-content: space-between;
  padding: 2.5rem 3rem 0;
  gap: 0.5rem;
`;

const Title = styled.h2`
  ${typography.Sans16}
  font-family: ${({ theme }) => theme.typography.fontFamily};
  color: ${({ theme }) => theme.typography.titleColor};
  outline: none;

  & span {
    color: ${({ theme }) => theme.palette.slate80};
  }
`;

const Subtitle = styled.div`
  ${typography.Sans14}
  font-family: ${({ theme }) => theme.typography.fontFamily};
  padding-top: 0.5rem;
  color: ${({ theme }) => theme.palette.slate80};
`;

const Content = styled.div<{ $withPadding: boolean }>`
  ${({ $withPadding }) => $withPadding && `padding-left: 2.5rem;`}
`;

type Props = {
  title: string;
  subtitle?: string;
  latestUpdate?: string;
  className?: string;
  legend?: React.ReactNode;
  withPadding?: boolean;
  children?: React.ReactNode;
};

const VizPathways: React.FC<Props> = ({
  title,
  subtitle,
  latestUpdate,
  className,
  legend,
  withPadding = true,
  children,
}) => {
  const screenReaderTitle = [
    `Chart: ${title}. `,
    latestUpdate && `as of ${latestUpdate}`,
  ]
    .filter(Boolean)
    .join(" ");

  return (
    <Wrapper className={className}>
      <Header>
        <Title
          id="chart-title"
          // Passing the title and description into the Semiotic chart wasn't working as
          // expected/documented. In order to have the chart title and description read by a
          // screen reader, allowing focus on the header is the only option.
          tabIndex={0}
          aria-label={screenReaderTitle}
          aria-describedby="chart-description chart-instructions"
        >
          {title} {latestUpdate && <span> as of {latestUpdate}</span>}
          {subtitle && (
            <Subtitle aria-label="Chart subtitle">{subtitle}</Subtitle>
          )}
        </Title>
        {legend}
      </Header>
      <Content $withPadding={withPadding} role="figure">
        {children}
      </Content>
    </Wrapper>
  );
};

export default VizPathways;
