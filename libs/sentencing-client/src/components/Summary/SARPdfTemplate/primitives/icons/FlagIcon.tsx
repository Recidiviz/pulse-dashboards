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

// Flag glyph (pole + waving banner). Transcribed verbatim from the Figma asset.
// This is a filled shape (unlike the stroked Target/Scales icons), so the Path
// uses `fill`. The source's clipPath is a full-bounds rect (a no-op) and is
// omitted. viewBox is 8x10, so the default width preserves that aspect ratio.
export const FlagIcon = ({
  height = 10,
  width = 8,
}: {
  height?: number;
  width?: number;
}) => (
  <Svg width={width} height={height} viewBox="0 0 8 10">
    <Path
      d="M7.53203 0.89375C7.45938 0.905469 7.38203 0.917187 7.3 0.926562C6.99062 0.966406 6.29688 1.04844 5.87969 1.04844C5.23047 1.04844 4.64219 0.889062 4.04688 0.7625C3.44219 0.633594 2.81875 0.5 2.15781 0.5C0.840625 0.5 0.392969 0.783594 0.346094 0.814063L0.25 0.882031V9.1625C0.25 9.33125 0.371875 9.47656 0.538281 9.49766C0.7375 9.52109 0.90625 9.36641 0.90625 9.17187V5.55312C0.90625 5.46406 0.969531 5.38672 1.05625 5.36797C1.30234 5.31875 1.66094 5.27656 2.15781 5.27656C2.77187 5.27656 3.34609 5.51094 3.95312 5.63984C4.57188 5.77109 5.09219 5.90937 5.90781 5.90937C6.72344 5.90937 7.59063 5.75469 7.59063 5.75469C7.68203 5.74062 7.75234 5.66328 7.75234 5.56953V1.07891C7.75 0.964062 7.64688 0.875 7.53203 0.89375Z"
      fill={color.text.default}
    />
  </Svg>
);
