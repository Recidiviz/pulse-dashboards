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

import { typography } from "@recidiviz/design-system";
import styled from "styled-components/macro";

import { palette } from "~design-system";

import { customPalette } from "../../../../../components/styles/palette";

export const TextContainer = styled.div`
  display: flex;
  gap: 32px;
`;

export const TextWrapper = styled.div`
  font-size: 11.5px;
  span {
    font-weight: bold;
  }
`;

export const ChartTitle = styled.div`
  ${typography.Sans18};
  display: flex;
  gap: 4px;
  align-items: center;
  color: ${palette.pine1};
  margin-bottom: 8px;
`;

export const ChartSubTitle = styled.div`
  ${typography.Sans14};
  font-weight: 600;
  margin-bottom: 8px;
  color: ${palette.slate80};

  span {
    font-weight: 500;
    font-style: italic;
  }
`;

export const ChartTooltipContentSection = styled.div`
  &:not(:first-child) {
    margin-top: 12px;
  }

  span {
    ${typography.Sans12}
    font-weight: 700;
    color: ${customPalette.green.highlight};
  }
`;

export const ChartLegendContainer = styled.div<{ isReport?: boolean }>`
  display: flex;
  ${({ isReport }) => isReport && `flex-direction: column; gap: 10px;`}
`;

export const ChartLegendWrapper = styled.div<{ isReport?: boolean }>`
  display: flex;
  align-items: center;
  min-width: ${({ isReport }) => (isReport ? "fit-content" : "500px")};
  margin-top: ${({ isReport }) => (isReport ? "0" : "21px")};

  & > div {
    margin-top: ${({ isReport }) => (isReport ? "0" : "35px")};
  }
`;

export const ChartLegend = styled.div`
  display: flex;
`;

export const ChartLegendItem = styled.div`
  display: flex;
  align-items: center;
  margin-right: 24px;
  color: ${palette.pine1};
`;

export const ChartLegendDot = styled.div<{
  $backgroundColor: string;
}>`
  width: 12px;
  height: 12px;
  margin-right: 8px;
  border-radius: 50%;
  background: ${(props) => props.$backgroundColor};
`;

export const ChartFootnote = styled.div<{ isReport?: boolean }>`
  color: "#2B5469CC";
  margin-top: 32px;

  ${({ isReport }) =>
    isReport &&
    `
      font-size: 12px;
    `}
`;
