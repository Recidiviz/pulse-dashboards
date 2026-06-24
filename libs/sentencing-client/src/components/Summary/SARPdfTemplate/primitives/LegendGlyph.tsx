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

import { ClipPath, Defs, G, Path, Svg } from "@react-pdf/renderer";
import React from "react";

import type { LegendGlyph as LegendGlyphType } from "../SARPdfTemplate.types";
import { color } from "../tokens";
import {
  GLYPH_FILL,
  glyphNeedsBorder,
  glyphTexturePaths,
  TEXTURE_STEP,
  TEXTURE_STROKE,
} from "./glyphTexture";

// Circle path covering a size×size box (used for both the fill and the clip).
const circlePath = (size: number): string => {
  const r = size / 2;
  return `M ${r} 0 a ${r} ${r} 0 1 0 0 ${size} a ${r} ${r} 0 1 0 0 ${-size} Z`;
};

/**
 * One legend chip — a solid-filled circle carrying the same texture as its
 * donut slice (clipped to the circle). Every glyph renders as a circle per the
 * Figma legend (12px round chips).
 */
export const LegendGlyphView: React.FC<{
  glyph: LegendGlyphType;
  size?: number;
}> = ({ glyph, size = 11 }) => {
  const clipId = `legend-clip-${glyph}`;
  const circle = circlePath(size);
  const texture = glyphTexturePaths(glyph, size, TEXTURE_STEP, TEXTURE_STROKE);
  return (
    <Svg width={size} height={size}>
      <Defs>
        <ClipPath id={clipId}>
          <Path d={circle} />
        </ClipPath>
      </Defs>
      <Path
        d={circle}
        fill={GLYPH_FILL[glyph]}
        stroke={glyphNeedsBorder(glyph) ? color.rule : "none"}
        strokeWidth={glyphNeedsBorder(glyph) ? 0.5 : 0}
      />
      {texture.length ? <G clipPath={`url(#${clipId})`}>{texture}</G> : null}
    </Svg>
  );
};
