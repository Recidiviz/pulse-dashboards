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

import { Path } from "@react-pdf/renderer";
import React from "react";

import type { LegendGlyph } from "../SARPdfTemplate.types";
import { color } from "../tokens";

// Base fill per glyph. Textured glyphs sit on the same dark base as
// `dark`/`Suspended` and are distinguished purely by the white pattern drawn on
// top (so they read as a family). Solid grays match the Figma ramp.
export const GLYPH_FILL: Record<LegendGlyph, string> = {
  light: color.donut.light,
  mid: color.donut.mid,
  dark: color.donut.dark,
  black: color.donut.black,
  stripes: color.donut.dark,
  dots: color.donut.dark,
  crosshatch: color.donut.dark,
  plus: color.donut.dark,
  empty: color.donut.empty,
};

// Light glyphs need a hairline border to be visible on the white card.
export const glyphNeedsBorder = (glyph: LegendGlyph): boolean =>
  glyph === "light" || glyph === "empty";

// Texture cell pitch + line weight, shared by the donut slice and its legend
// chip. Both pass these exact values so a slice and the chip that labels it
// render the IDENTICAL texture swatch (same absolute cell size, same stroke) —
// the chip reads as a literal sample of its slice, not a coarser stand-in.
export const TEXTURE_STEP = 2.6;
export const TEXTURE_STROKE = 0.5;

/**
 * White pattern paths for a textured glyph, spanning a `size`×`size` box. The
 * caller clips these to the target shape (a circle for the legend chip, the
 * slice arc for the donut) via a `<G clipPath>`. Solid glyphs return [].
 *
 * `step` (pattern pitch) and `stroke` (line/dot weight) are absolute, so passing
 * the shared `TEXTURE_STEP`/`TEXTURE_STROKE` at both call sites yields the same
 * cell size in the tiny legend chip and the large donut alike.
 */
export const glyphTexturePaths = (
  glyph: LegendGlyph,
  size: number,
  step: number,
  stroke: number,
): React.ReactNode[] => {
  const paths: React.ReactNode[] = [];
  const white = "#FFFFFF";

  if (glyph === "stripes") {
    // 45° lines in one direction; start off-canvas so the fill is even.
    for (let x = -size; x <= size; x += step) {
      paths.push(
        <Path
          key={`s${x}`}
          d={`M ${x} ${size} L ${x + size} 0`}
          stroke={white}
          strokeWidth={stroke}
        />,
      );
    }
  } else if (glyph === "crosshatch") {
    for (let x = -size; x <= size; x += step) {
      paths.push(
        <Path
          key={`a${x}`}
          d={`M ${x} 0 L ${x + size} ${size}`}
          stroke={white}
          strokeWidth={stroke}
        />,
        <Path
          key={`b${x}`}
          d={`M ${x} ${size} L ${x + size} 0`}
          stroke={white}
          strokeWidth={stroke}
        />,
      );
    }
  } else if (glyph === "plus") {
    // Orthogonal grid — the line intersections read as a field of "+".
    for (let v = step / 2; v <= size; v += step) {
      paths.push(
        <Path
          key={`v${v}`}
          d={`M ${v} 0 L ${v} ${size}`}
          stroke={white}
          strokeWidth={stroke}
        />,
      );
    }
    for (let h = step / 2; h <= size; h += step) {
      paths.push(
        <Path
          key={`h${h}`}
          d={`M 0 ${h} L ${size} ${h}`}
          stroke={white}
          strokeWidth={stroke}
        />,
      );
    }
  } else if (glyph === "dots") {
    const r = stroke;
    let i = 0;
    for (let y = step / 2; y < size; y += step) {
      for (let x = step / 2; x < size; x += step) {
        paths.push(
          <Path
            key={`d${i++}`}
            d={`M ${x} ${y} m -${r} 0 a ${r} ${r} 0 1 0 ${r * 2} 0 a ${r} ${r} 0 1 0 ${-r * 2} 0`}
            fill={white}
          />,
        );
      }
    }
  }
  return paths;
};
