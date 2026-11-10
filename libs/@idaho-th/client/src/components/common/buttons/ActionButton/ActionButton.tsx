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

import React from "react";

import { Button1, Button2 } from "../../../../styles";
import { Spinner } from "../../LoadingSpinner";
import * as Styled from "./ActionButton.styles";

export type ActionButtonVariant =
  | "primary"
  | "secondary"
  | "destructive"
  | "warning";

export type ActionButtonSize = "md" | "lg";

const LABEL_BY_SIZE = {
  md: Button2,
  lg: Button1,
};

interface ActionButtonProps
  extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: ActionButtonVariant;
  size?: ActionButtonSize;
  children: React.ReactNode;
  startIcon?: React.ReactNode;
  isLoading?: boolean;
  fullWidth?: boolean;
  height?: string;
  width?: string;
}

export const ActionButton: React.FC<ActionButtonProps> = ({
  variant = "primary",
  size = "lg",
  children,
  startIcon,
  isLoading,
  fullWidth,
  height,
  width,
  ...rest
}) => {
  const textVisibility = isLoading ? "hidden" : "visible";
  const Label = LABEL_BY_SIZE[size];
  return (
    <Styled.StyledButton
      type="button"
      $variant={variant}
      $size={size}
      $fullWidth={fullWidth}
      $height={height}
      $width={width}
      disabled={isLoading}
      {...rest}
    >
      {startIcon && (
        <Styled.IconSlot style={{ visibility: textVisibility }}>
          {startIcon}
        </Styled.IconSlot>
      )}
      <Label style={{ visibility: textVisibility }}>{children}</Label>
      {isLoading && (
        <Styled.SpinnerOverlay>
          <Spinner size="1rem" />
        </Styled.SpinnerOverlay>
      )}
    </Styled.StyledButton>
  );
};
