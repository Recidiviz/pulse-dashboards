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

// Info glyph (circled "i"). Transcribed verbatim from the Figma asset. This is
// a filled shape, so the Path uses `fill`; the muted blue-gray is tokenized as
// `color.icon.info` (a cool-grey accent kept off the neutral ramp). viewBox is
// 16x16, so the default square width preserves the aspect ratio.
export const InfoIcon = ({
  height = 10,
  width = 10,
}: {
  height?: number;
  width?: number;
}) => (
  <Svg width={width} height={height} viewBox="0 0 16 16">
    <Path
      d="M7.66667 0C3.43233 0 0 3.43233 0 7.66667C0 11.901 3.43233 15.3333 7.66667 15.3333C11.901 15.3333 15.3333 11.901 15.3333 7.66667C15.3333 3.43233 11.901 0 7.66667 0ZM8.33333 12C8.33333 12.184 8.184 12.3333 8 12.3333H7.33333C7.14933 12.3333 7 12.184 7 12V6C7 5.816 7.14933 5.66667 7.33333 5.66667H8C8.184 5.66667 8.33333 5.816 8.33333 6V12ZM7.66667 4.33333C7.20633 4.33333 6.83333 3.96033 6.83333 3.5C6.83333 3.03967 7.20633 2.66667 7.66667 2.66667C8.127 2.66667 8.5 3.03967 8.5 3.5C8.5 3.96033 8.127 4.33333 7.66667 4.33333Z"
      fill={color.icon.info}
    />
  </Svg>
);
