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

import type { JSX } from "react";
import * as React from "react";
import { renderToStaticMarkup } from "react-dom/server";

import { ExternalPropsContext, IconSVG, IconSVGProps } from "./IconSVG";

export interface IconProps extends IconSVGProps {
  className?: string;
  color?: string;
  kind: keyof typeof IconSVG | React.FC;
  size?: string | number;
  rotate?: number;
}

export const Icon: React.FC<IconProps> = ({
  height,
  color = "currentColor",
  kind,
  size,
  width,
  rotate,
  ...rest
}: IconProps) => {
  let SVG;
  if (typeof kind === "string") {
    SVG = IconSVG[kind];
  }

  if (typeof kind === "function") {
    SVG = kind;
  }

  const assignedHeight = typeof size === "undefined" ? height : size;
  const assignedWidth = typeof size === "undefined" ? width : size;
  const assignedRotate =
    typeof rotate === "undefined" ? undefined : `rotate(${rotate})`;

  const iconProps: IconSVGProps = {
    ...rest,
    color,
    transform: assignedRotate,
    height: assignedHeight,
    width: assignedWidth,
  };

  if (!SVG) {
    iconProps.color = "red";
    SVG = IconSVG["Error"];
  }

  return (
    <ExternalPropsContext.Provider value={iconProps}>
      <SVG />
    </ExternalPropsContext.Provider>
  );
};

export const iconToDataURI = (template: JSX.Element): string =>
  `url("data:image/svg+xml,${encodeURIComponent(
    renderToStaticMarkup(template),
  )}")`;
