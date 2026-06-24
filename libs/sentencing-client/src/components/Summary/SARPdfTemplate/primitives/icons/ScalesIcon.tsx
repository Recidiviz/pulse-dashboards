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

// Scales-of-justice glyph. Transcribed verbatim from the Figma asset; stroked
// outline, so every Path sets fill="none" (react-pdf defaults Path fill to
// black, which would otherwise flood the beam/pan shape).
export const ScalesIcon = ({
  height = 10,
  width = 10,
}: {
  height?: number;
  width?: number;
}) => (
  <Svg width={width} height={height} viewBox="0 0 20 20">
    <Path
      d="M10.002 4.1674V2.50073"
      stroke={color.text.default}
      strokeWidth={1.66667}
      strokeLinecap="square"
      fill="none"
    />
    <Path
      d="M10.002 17.5V4.16663"
      stroke={color.text.default}
      strokeWidth={1.66667}
      strokeLinecap="square"
      fill="none"
    />
    <Path
      d="M5.83398 17.5002H14.1673"
      stroke={color.text.default}
      strokeWidth={1.66667}
      strokeLinecap="square"
      fill="none"
    />
    <Path
      d="M4.19143 4.21172L4.16732 4.16663L7.43398 10.2777C7.43398 11.9653 5.95653 13.3333 4.13398 13.3333C2.31144 13.3333 0.833984 11.9653 0.833984 10.2777L4.13398 4.16663H15.8673L19.1673 10.2777C19.1673 11.9653 17.6899 13.3333 15.8673 13.3333C14.0448 13.3333 12.5673 11.9653 12.5673 10.2777L15.834 4.16663L15.8092 4.2129"
      stroke={color.text.default}
      strokeWidth={1.66667}
      strokeLinecap="square"
      fill="none"
    />
  </Svg>
);
