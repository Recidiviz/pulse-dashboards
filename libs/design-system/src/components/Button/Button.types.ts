// Recidiviz - a data platform for criminal justice reform
// Copyright (C) 2025 Recidiviz, Inc.
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

import { IconSVG } from "@recidiviz/design-system";
import React, { MouseEventHandler, ReactNode } from "react";

export type ButtonKind = "primary" | "secondary" | "link" | "borderless";
export type ButtonShape = "pill" | "block";

export interface ButtonProps
  extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  /**
   * children will not be rendered if an icon is specified
   */
  children?: ReactNode;

  className?: string;

  kind?: ButtonKind;
  /**
   * `shape` has no effect when `kind === "link"`
   */
  shape?: ButtonShape;
  disabled?: boolean;

  onClick?: MouseEventHandler<HTMLButtonElement>;
  icon?: keyof typeof IconSVG;
  iconSize?: number;
}
