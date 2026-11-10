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

import styled from "styled-components";

import {
  BodyS1,
  borderRadius,
  fontWeights,
  palette,
  spacing,
} from "../../../../styles";

export const Banner = styled.div`
  align-items: flex-start;
  background: ${palette.misc.catskillWhite};
  border-radius: ${borderRadius[12]};
  box-sizing: border-box;
  color: ${palette.foreground.information};
  display: flex;
  flex-direction: row;
  gap: ${spacing[2]};
  padding: ${spacing[3]};
  width: 100%;
`;

export const BannerIcon = styled.span`
  align-items: center;
  display: flex;
  flex: none;
  height: 1.25rem;
  margin-top: 3px;
`;

export const BannerText = styled(BodyS1)`
  color: inherit;
`;

export const BannerEmphasis = styled.span`
  font-weight: ${fontWeights.semiBold};
`;
