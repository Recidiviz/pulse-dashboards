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

import styled from "styled-components/macro";

export const RecidivismChartLegend = styled.div`
  display: flex;
`;

export const RecidivismChartLegendItem = styled.div`
  display: flex;
  align-items: center;
  margin-right: 24px;
`;

export const RecidivismChartLegendDot = styled.div<{
  $backgroundColor: string;
}>`
  width: 12px;
  height: 12px;
  margin-right: 8px;
  border-radius: 50%;
  background: ${(props) => props.$backgroundColor};
`;

export const RecidivismChartPlotContainer = styled.div<{
  $width: number;
}>`
  width: ${(props) => props.$width}px;
`;
