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

import { palette, typography } from "@recidiviz/design-system";
import styled from "styled-components/macro";

import { customPalette } from "../../../../../components/styles/palette";

export const TextContainer = styled.div`
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
    font-weight: 400;
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
