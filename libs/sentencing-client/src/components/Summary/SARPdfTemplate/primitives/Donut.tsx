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

// Donut slices, clip paths, and texture overlays all render from a single
// ordered geometry array; array indices are safe React keys here.
/* eslint-disable react/no-array-index-key */

import { ClipPath, Defs, G, Path, Svg } from "@react-pdf/renderer";
import React from "react";

import type {
  PdfStyle,
  SentenceDistributionItem,
} from "../SARPdfTemplate.types";
import { color } from "../tokens";
import {
  GLYPH_FILL,
  glyphTexturePaths,
  TEXTURE_STEP,
  TEXTURE_STROKE,
} from "./glyphTexture";

// Inner/outer diameter ratio sampled from the Figma pie (node 5980:117 —
// outer 260, inner ~130), i.e. the hole is half the outer diameter.
const INNER_OUTER_RATIO = 0.5;

/**
 * Returns the SVG `d` for one ring sector (donut slice) spanning
 * [startAngle, endAngle].
 *
 * Coordinate system: SVG y grows downward, and angles are measured clockwise
 * from straight up (12 o'clock). For a point at radius R and angle θ that means
 * `x = cx + R·sin θ` and `y = cy − R·cos θ` — the `−cos` flips the math-y axis
 * so θ=0 lands at the top and the sweep runs clockwise.
 *
 * The path traces four corners: outer-start (1) → outer-end (2) along the outer
 * arc, in to inner-end (3), back to inner-start (4) along the inner arc, then
 * close. `largeArc` is SVG's large-arc-flag: 1 when the slice spans more than a
 * half-circle (>180°), which tells SVG to take the long way around. The two
 * arcs use opposite sweep flags (1 then 0) because they're traced in opposite
 * directions.
 */
const sliceArcPath = (
  cx: number,
  cy: number,
  outerR: number,
  innerR: number,
  startAngle: number,
  endAngle: number,
): string => {
  const x1 = cx + outerR * Math.sin(startAngle); // outer arc, start
  const y1 = cy - outerR * Math.cos(startAngle);
  const x2 = cx + outerR * Math.sin(endAngle); // outer arc, end
  const y2 = cy - outerR * Math.cos(endAngle);
  const x3 = cx + innerR * Math.sin(endAngle); // inner arc, end
  const y3 = cy - innerR * Math.cos(endAngle);
  const x4 = cx + innerR * Math.sin(startAngle); // inner arc, start
  const y4 = cy - innerR * Math.cos(startAngle);
  const largeArc = endAngle - startAngle > Math.PI ? 1 : 0;
  return [
    `M ${x1} ${y1}`,
    `A ${outerR} ${outerR} 0 ${largeArc} 1 ${x2} ${y2}`,
    `L ${x3} ${y3}`,
    `A ${innerR} ${innerR} 0 ${largeArc} 0 ${x4} ${y4}`,
    "Z",
  ].join(" ");
};

export const Donut: React.FC<{
  items: SentenceDistributionItem[];
  size?: number;
  style?: PdfStyle;
}> = ({ items, size = 150, style = {} }) => {
  // Center the ring in the square viewBox. `outerR` insets 2pt from the edge so
  // the slice stroke isn't clipped by the SVG bounds; `innerR` is the hole.
  const cx = size / 2;
  const cy = size / 2;
  const outerR = size / 2 - 2;
  const innerR = outerR * INNER_OUTER_RATIO;
  const visible = items.filter((d) => d.pct > 0);
  // `|| 1` guards against a divide-by-zero when every slice is 0%.
  const total = visible.reduce((s, d) => s + d.pct, 0) || 1;

  let cumulative = 0;
  const slices = visible.map((d) => {
    const startAngle = (cumulative / total) * Math.PI * 2;
    cumulative += d.pct;
    const endAngle = (cumulative / total) * Math.PI * 2;
    return {
      d,
      path: sliceArcPath(cx, cy, outerR, innerR, startAngle, endAngle),
    };
  });

  return (
    <Svg width={size} height={size} style={style}>
      <Defs>
        {slices.map((s, i) => (
          <ClipPath key={i} id={`donut-slice-${i}`}>
            <Path d={s.path} />
          </ClipPath>
        ))}
      </Defs>
      {/* Base color fills, separated by thin white seams */}
      {slices.map((s, i) => (
        <Path
          key={i}
          d={s.path}
          fill={GLYPH_FILL[s.d.glyph]}
          stroke={color.donut.seam}
          strokeWidth={1}
        />
      ))}
      {/* White texture overlays clipped to each slice */}
      {slices.map((s, i) => {
        const texture = glyphTexturePaths(
          s.d.glyph,
          size,
          TEXTURE_STEP,
          TEXTURE_STROKE,
        );
        return texture.length ? (
          <G key={i} clipPath={`url(#donut-slice-${i})`}>
            {texture}
          </G>
        ) : null;
      })}
    </Svg>
  );
};
