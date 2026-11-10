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

import { palette } from "../../../../styles";

const checkBoxBorderRadius = "6.25px";

export const CheckboxBox = styled.div<{
  $checked: boolean;
  $sizePx: number;
  $disabled?: boolean;
}>`
  align-items: center;
  background: ${({ $checked }) =>
    $checked ? palette.background.brand : palette.background.secondary};
  border-radius: ${checkBoxBorderRadius};
  border: 1.25px solid
    ${({ $checked }) =>
      $checked ? palette.background.brand : palette.border.subtle};
  box-sizing: border-box;
  color: ${palette.foreground.onBrand};
  cursor: ${({ $disabled }) => ($disabled ? "default" : "pointer")};
  display: flex;
  flex: none;
  height: ${({ $sizePx }) => $sizePx}px;
  justify-content: center;
  min-height: ${({ $sizePx }) => $sizePx}px;
  min-width: ${({ $sizePx }) => $sizePx}px;
  width: ${({ $sizePx }) => $sizePx}px;

  & > svg {
    display: block;
    height: ${({ $sizePx }) => $sizePx * 0.4}px;
    width: ${({ $sizePx }) => $sizePx * 0.6}px;
  }
`;

export const Label = styled.label`
  align-items: center;
  display: inline-flex;
  position: relative;

  &:has(input:focus-visible) ${CheckboxBox} {
    outline: 0.5px solid ${palette.background.brand};
    outline-offset: 0px;
  }
`;

export const HiddenInput = styled.input.attrs({ type: "checkbox" })`
  clip: rect(0 0 0 0);
  clip-path: inset(50%);
  height: 1px;
  overflow: hidden;
  position: absolute;
  white-space: nowrap;
  width: 1px;
`;
