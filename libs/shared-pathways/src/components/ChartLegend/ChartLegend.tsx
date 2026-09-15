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
  display: flex;
  flex-wrap: wrap;
  gap: 1.125rem;
  align-items: center;
`;

const Item = styled.span`
  ${typography.Sans14}
  display: flex;
  align-items: center;
  gap: 0.375rem;
  font-family: ${({ theme }) => theme.typography.fontFamily};
  color: ${({ theme }) => theme.chart.subtitleColor};
`;

const Swatch = styled.span<{ $color: string }>`
  width: 0.5625rem;
  height: 0.5625rem;
  border-radius: 50%;
  background: ${({ $color }) => $color};
  flex-shrink: 0;
`;

export type ChartLegendItem = {
  name: string;
  color: string;
};

/**
 * Names the colors a chart uses when it draws more than one, so a reader can
 * tell which line or bar counts what. The over-time and snapshot charts share
 * it, so one color means the same thing on every chart of a dashboard.
 */
const ChartLegend: React.FC<{ items: ChartLegendItem[] }> = ({ items }) => (
  <Wrapper>
    {items.map(({ name, color }) => (
      <Item key={name}>
        <Swatch $color={color} aria-hidden="true" />
        {name}
      </Item>
    ))}
  </Wrapper>
);

export default ChartLegend;
