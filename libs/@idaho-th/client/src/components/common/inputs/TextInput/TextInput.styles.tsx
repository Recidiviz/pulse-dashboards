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
  borderRadius,
  fontFamilies,
  fontSizes,
  fontWeights,
  letterSpacings,
  palette,
  spacing,
} from "../../../../styles";

export const Input = styled.input<{ $hasError?: boolean }>`
  font-family: ${fontFamilies.inter};
  font-size: ${fontSizes.bodyM};
  font-weight: ${fontWeights.regular};
  letter-spacing: ${letterSpacings.bodyM};
  background: ${palette.background.primary};
  border-radius: ${borderRadius[8]};
  border: 1px solid
    ${({ $hasError }) =>
      $hasError ? palette.border.attention : palette.border.subtle};
  box-sizing: border-box;
  color: ${palette.foreground.primary};
  height: 2.25rem;
  outline: none;
  padding: 0 ${spacing[3]};
  width: 100%;

  &:focus-visible {
    border-color: ${palette.border.brand};
    box-shadow: ${palette.shadow.brand};
  }

  &:disabled {
    background: ${palette.background.secondary};
    color: ${palette.foreground.disabled};
    cursor: default;
  }
`;

export const ErrorText = styled.span`
  color: ${palette.foreground.attention};
  display: block;
  font-family: ${fontFamilies.inter};
  font-size: ${fontSizes.caption};
  letter-spacing: ${letterSpacings.caption};
  margin-top: ${spacing[1]};
`;
