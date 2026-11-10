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

import { palette, spacing } from "../../../../styles";
import { buttonOutline } from "../../StyledComponents";
import { ActionButtonSize, ActionButtonVariant } from "./ActionButton";

const BUTTON_BG: Record<ActionButtonVariant, string> = {
  primary: palette.background.brand,
  secondary: palette.background.secondary,
  destructive: palette.background.attention,
  warning: palette.misc.brightestGold,
};

const BUTTON_COLOR: Record<ActionButtonVariant, string> = {
  primary: palette.foreground.onBrand,
  secondary: palette.foreground.primary,
  destructive: palette.foreground.onBrand,
  warning: palette.foreground.primary,
};

const BUTTON_HEIGHT: Record<ActionButtonSize, string> = {
  md: "2rem",
  lg: "2.75rem",
};

const BUTTON_GAP: Record<ActionButtonSize, string> = {
  md: spacing[1],
  lg: spacing[2],
};

const BUTTON_PADDING: Record<ActionButtonSize, string> = {
  md: `0 ${spacing[4]} 0 ${spacing[3]}`,
  lg: `0 ${spacing[5]}`,
};

export const StyledButton = styled.button<{
  $variant: ActionButtonVariant;
  $size: ActionButtonSize;
  $fullWidth?: boolean;
  $height?: string;
  $width?: string;
}>`
  ${buttonOutline}
  align-items: center;
  background: ${({ $variant }) => BUTTON_BG[$variant]};
  border: none;
  border-radius: 62.4375rem;
  box-sizing: border-box;
  color: ${({ $variant }) => BUTTON_COLOR[$variant]};
  cursor: pointer;
  display: flex;
  flex: ${({ $fullWidth }) => ($fullWidth ? "1 1 0" : "none")};
  gap: ${({ $size }) => BUTTON_GAP[$size]};
  height: ${({ $height, $size }) => $height || BUTTON_HEIGHT[$size]};
  justify-content: center;
  min-height: ${({ $height, $size }) => $height || BUTTON_HEIGHT[$size]};
  min-width: ${({ $fullWidth }) => ($fullWidth ? "fit-content" : "auto")};
  padding: ${({ $size }) => BUTTON_PADDING[$size]};
  position: relative;
  white-space: nowrap;
  width: ${({ $width }) => $width || "auto"};

  &:hover {
    opacity: 0.9;
  }

  &:disabled {
    background: ${palette.background.disabled};
    color: ${palette.foreground.onDisabled};
    cursor: default;
  }
`;

export const IconSlot = styled.span`
  align-items: center;
  display: flex;
  flex: none;
`;

export const SpinnerOverlay = styled.span`
  align-items: center;
  display: flex;
  inset: 0;
  justify-content: center;
  position: absolute;
`;
