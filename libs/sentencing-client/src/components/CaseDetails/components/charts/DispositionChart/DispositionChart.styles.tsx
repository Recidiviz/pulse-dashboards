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

import styled from "styled-components";

import { palette } from "~design-system";

export const DispositionChartBySentenceTypeContainer = styled.div<{
  $justify: string;
}>`
  display: flex;
  justify-content: ${(props) => props.$justify};
  align-items: flex-end;
  padding-top: 32px;
  padding: 32px 20px 0 20px;
  margin-top: auto;
`;

export const DispositionChartCircleContainer = styled.div`
  display: flex;
  flex-direction: column;
  align-items: center;
  margin-bottom: 20px;
`;

export const DispositionChartCircle = styled.div<{
  $height: number;
  $backgroundColor: string;
  $borderColor?: string;
  $hideCircle?: boolean;
}>`
  width: ${(props) => props.$height}px;
  height: ${(props) => props.$height}px;
  line-height: ${(props) => props.$height}px;
  display: flex;
  align-items: center;
  justify-content: center;
  margin-bottom: 16px;
  border-radius: 50%;
  font-size: 26px;
  font-weight: 400;
  color: #ffffff;
  text-align: center;
  background: ${(props) => props.$backgroundColor};
  border: ${(props) =>
    props.$borderColor ? `4px solid ${props.$borderColor}` : "none"};

  ${({ $hideCircle }) => $hideCircle && `opacity: 0;`}
`;

export const DispositionChartCircleLabel = styled.div<{
  $color: string;
}>`
  color: ${(props) => props.$color};
`;

export const DispositionDonutChartContainer = styled.div`
  display: flex;
  flex-direction: column;
  align-items: center;
  margin-top: 47px;
`;

export const DonutChartContainer = styled.div`
  display: flex;
  flex-direction: column;
  position: relative;

  path:hover {
    cursor: default;
  }
`;

export const DonutTooltipContainer = styled.div`
  position: fixed;
  width: 220px;
  padding: 16px;
  display: flex;
  flex-direction: column;
  gap: 8px;
  border-radius: 8px;
  background: ${palette.pine1};
  box-shadow: 0 2px 10px 0 rgba(0, 0, 0, 0.1);
  pointer-events: none;
  z-index: 10;
  font-family: "Public Sans";
`;

export const DonutTooltipHeader = styled.div`
  color: ${palette.white};
  font-size: 14px;
  font-weight: 500;
`;

export const DonutTooltipBody = styled.div`
  color: ${palette.white80};
  font-size: 12px;
  font-weight: 500;
  letter-spacing: -0.12px;
`;

export const DonutChartRow = styled.div<{
  isReport?: boolean;
  inlineLayout?: boolean;
}>`
  display: flex;
  gap: 24px;
  ${({ isReport, inlineLayout }) =>
    !isReport &&
    !inlineLayout &&
    `flex-direction: column; align-items: center; gap: 0px;`}
  ${({ inlineLayout }) =>
    inlineLayout &&
    `align-items: center; width: 100%; & > svg { flex-shrink: 0; }`}
`;
