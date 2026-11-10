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

import { borderRadius, palette, spacing } from "../../../../styles";
import { BodyS1 } from "../../../../styles/typography";

export const ChipLabel = styled.label<{ $selected: boolean }>`
  align-items: center;
  background: ${palette.background.primary};
  border-radius: ${borderRadius.round};
  border: 1px solid
    ${({ $selected }) =>
      $selected ? palette.border.brand : palette.border.subtle};
  cursor: pointer;
  display: inline-flex;
  gap: ${spacing[2]};
  padding: ${spacing[1.5]} ${spacing[3]};

  &:has(input:disabled) {
    cursor: default;
    opacity: 0.6;
  }

  &:has(input:focus-visible) {
    box-shadow: ${palette.shadow.brand};
  }
`;

// Visually hidden rather than removed, so keyboard and screen-reader radio
// behaviour comes from the native input.
export const HiddenRadio = styled.input.attrs({ type: "radio" })`
  height: 1px;
  margin: -1px;
  overflow: hidden;
  position: absolute;
  white-space: nowrap;
  width: 1px;
  clip-path: inset(50%);
`;

const radioSizePx = 18;
// Whole pixels so the dot's surrounding space divides evenly and it stays
// optically centred at every device pixel ratio.
const radioDotSizePx = 6;

export const RadioIndicator = styled.span<{ $selected: boolean }>`
  background: ${({ $selected }) =>
    $selected ? palette.background.brand : palette.background.secondary};
  border-radius: ${borderRadius.round};
  border: 1px solid
    ${({ $selected }) =>
      $selected ? palette.background.brand : palette.border.subtle};
  box-sizing: border-box;
  display: grid;
  flex: none;
  height: ${radioSizePx}px;
  place-items: center;
  width: ${radioSizePx}px;
`;

export const RadioDot = styled.span`
  background: ${palette.foreground.onBrand};
  border-radius: ${borderRadius.round};
  height: ${radioDotSizePx}px;
  width: ${radioDotSizePx}px;
`;

export const ChipText = styled(BodyS1)<{ $selected: boolean }>`
  color: ${({ $selected }) =>
    $selected ? palette.foreground.brand : palette.foreground.primary};
  white-space: nowrap;
`;
