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
import * as React from "react";
import styled from "styled-components";

import { Icon, iconToDataURI, palette } from "~design-system";

const DEFAULT_SIZE = 16;

const CHECK_BACKGROUND = iconToDataURI(
  <Icon kind="Check" color={palette.marble1} />,
);

const StyledCheckbox = styled.input<{ $size: number }>`
  appearance: none;
  -webkit-appearance: none;
  width: ${({ $size }) => rem($size)};
  height: ${({ $size }) => rem($size)};
  margin: 0;
  flex-shrink: 0;
  border: 1px solid ${palette.slate30};
  border-radius: ${rem(2)};
  background-color: transparent;
  background-position: center;
  background-repeat: no-repeat;
  background-size: 70%;
  cursor: pointer;
  transition:
    background-color 0.1s ease-in-out,
    border-color 0.1s ease-in-out,
    transform 0.05s ease-in-out;

  &:checked {
    background-color: ${palette.pine4};
    border-color: ${palette.pine4};
    background-image: ${CHECK_BACKGROUND};
  }

  &:hover:not(:disabled):not(:checked) {
    border-color: ${palette.slate70};
    background-color: ${palette.slate10};
  }

  &:hover:not(:disabled):checked {
    background-color: ${palette.pine3};
    border-color: ${palette.pine3};
  }

  &:active:not(:disabled) {
    transform: scale(0.94);
  }

  &:focus-visible {
    outline: 2px solid ${palette.signal.links};
    outline-offset: 2px;
  }

  &:disabled {
    cursor: not-allowed;
    opacity: 0.5;
  }
`;

export interface CheckboxInputProps
  extends Omit<React.InputHTMLAttributes<HTMLInputElement>, "type" | "size"> {
  size?: number;
}

export const CheckboxInput = React.forwardRef<
  HTMLInputElement,
  CheckboxInputProps
>(function CheckboxInput({ size = DEFAULT_SIZE, ...inputProps }, ref) {
  return (
    <StyledCheckbox type="checkbox" $size={size} ref={ref} {...inputProps} />
  );
});
