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

import { rem } from "polished";
import styled from "styled-components";

import { palette, spacing, typography } from "../../styles";

export type PillProps = {
  color: string;
  filled?: boolean;
  textColor?: string;
};

const pillPropsToStyles = ({ color, filled, textColor }: PillProps): string => {
  const property = filled ? "background-color" : "border-color";
  const textColorValue = textColor
    ? `color: ${textColor}`
    : `color: ${palette.text.caption}`;

  return `
    ${property}: ${color};
    ${filled && !textColor ? `color: ${palette.white}` : textColorValue}
  `;
};

export const Pill = styled.span<PillProps>`
  ${typography.Sans14}
  align-items: center;
  border-radius: ${rem(16)};
  border: 1px solid transparent;
  box-sizing: border-box;
  display: inline-flex;
  height: ${rem(32)};
  justify-content: center;
  margin-right: ${rem(spacing.xs)};
  padding: ${rem(spacing.xs)} ${rem(12)};
  white-space: nowrap;

  ${pillPropsToStyles}
`;
