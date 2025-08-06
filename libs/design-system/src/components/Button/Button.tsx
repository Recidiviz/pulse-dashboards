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

import { Icon } from "@recidiviz/design-system";
import * as React from "react";

import { BaseButton, LinkButton } from "./Button.styles";
import { ButtonProps } from "./Button.types";

export const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  function Button(
    {
      children,
      className = "",
      kind = "primary",
      shape = "pill",
      disabled = false,
      onClick,
      icon,
      iconSize = 16,
      type = "button",
      ...attributes
    },
    ref,
  ) {
    const Component = kind === "link" ? LinkButton : BaseButton;

    return (
      <Component
        className={className}
        onClick={disabled ? undefined : onClick}
        disabled={disabled}
        shape={shape}
        kind={kind}
        type={type}
        {...attributes}
        ref={ref}
      >
        {icon ? <Icon kind={icon} size={iconSize} /> : children}
      </Component>
    );
  },
);
