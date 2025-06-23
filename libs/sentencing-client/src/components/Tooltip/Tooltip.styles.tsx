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

import { customPalette } from "../styles/palette";

export const TooltipHeader = styled.div`
  margin-bottom: 8px;
  font-weight: 500;
`;

export const TooltipBody = styled.div`
  font-weight: 500;
`;

export const TooltipContentContainer = styled.div`
  padding: 12px;
  color: white;

  & > TooltipHeader {
    ${typography.Sans14}
  }

  & > TooltipBody {
    ${typography.Sans12}
  }
`;

export const TooltipContentSection = styled.div`
  &:not(:first-child) {
    margin-top: 12px;
  }
`;

export const TooltipTextHighlight = styled.span`
  ${typography.Sans12}
  font-weight: 700;
  color: ${customPalette.green.highlight};
`;
