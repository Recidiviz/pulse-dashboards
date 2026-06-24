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

import { Path, Svg } from "@react-pdf/renderer";
import React from "react";

import { color } from "../../tokens";

export const HomeIcon = ({
  height = 10,
  width = 10,
}: {
  height?: number;
  width?: number;
}) => (
  <Svg width={width} height={height} viewBox="0 0 24 24">
    <Path
      d="M3 12 L12 3 L21 12 L19 12 L19 21 L14 21 L14 14 L10 14 L10 21 L5 21 L5 12 Z"
      fill={color.text.default}
    />
  </Svg>
);
