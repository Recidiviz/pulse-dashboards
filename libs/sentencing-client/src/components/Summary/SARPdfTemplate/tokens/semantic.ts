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

// -----------------------------------------------------------------------------
// SEMANTIC TOKENS — the role layer. Every token here names INTENT ("border on a
// card", "muted text", "block-to-block gap") and resolves to a primitive from
// `./primitives`. This is the ONLY token surface UI components import, so a
// future palette/scale change is made once, here, by re-pointing a role at a
// different primitive — components never change.
// -----------------------------------------------------------------------------

import * as primitive from "./primitives";

export const color = {
  text: {
    default: primitive.black,
    muted: primitive.gray[600],
    faint: primitive.gray[500],
    /** Text/glyphs sitting on a dark fill (records chip, filled risk pip). */
    inverse: primitive.white,
  },
  border: {
    /** Full-strength hairline rules, table borders, the heading underline. */
    strong: primitive.black,
    /** Faint dividers (footer rule, legend chip outline). */
    faint: primitive.gray[200],
    /** Page-1 offense card outer border. */
    card: primitive.gray[50],
  },
  /** Horizontal rules / table row separators. */
  rule: primitive.gray[200],
  surface: {
    section: primitive.gray[50],
    card: primitive.white,
    pill: primitive.white,
    info: primitive.slate[100],
    banner: primitive.slate[50],
    chip: primitive.gray[600],
  },
  /** ORAS risk badges — fill + label per level. */
  badge: {
    high: { bg: primitive.black, text: primitive.white },
    moderate: { bg: primitive.gray[300], text: primitive.black },
    low: { bg: primitive.gray[100], text: primitive.black },
  },
  /**
   * Historical-outcome donut / legend swatches. Keyed by glyph family; textured
   * glyphs share `dark` and are distinguished by the white pattern drawn on top.
   */
  donut: {
    light: primitive.gray[100],
    mid: primitive.gray[400],
    dark: primitive.gray[600],
    black: primitive.black,
    /** 0% buckets — white slice/chip needing a hairline border to show. */
    empty: primitive.white,
    /** Thin seams between donut slices. */
    seam: primitive.white,
  },
  icon: {
    info: primitive.slate[400],
  },
  bar: {
    /** Faint fill of the average-time-served progress bar. */
    fillFaint: primitive.inkAlpha[30],
  },
} as const;

export const space = {
  // Raw spacing scale, px-keyed for legible call sites (`padding: space[8]`).
  // Components snap onto these steps; odd one-off values were consolidated away.
  0: primitive.space[0],
  2: primitive.space[50],
  4: primitive.space[100],
  6: primitive.space[150],
  8: primitive.space[200],
  10: primitive.space[250],
  12: primitive.space[300],
  16: primitive.space[400],
  20: primitive.space[500],
  24: primitive.space[600],
  // Named roles.
  /** Gap above an in-block sub-banner (`SectionHeading`). */
  sectionGap: primitive.space[150],
  /** Gap between top-level report blocks (owned by `SARPdfTemplate`). */
  blockGap: primitive.space[300],
  /** Page frame. */
  pageMargin: {
    top: primitive.pageFrame.top,
    bottom: primitive.pageFrame.bottom,
    x: primitive.pageFrame.x,
  },
} as const;

export const font = {
  family: primitive.fontFamily.body,
  size: {
    xxs: primitive.fontSize[50],
    xs: primitive.fontSize[100],
    sm: primitive.fontSize[200],
    base: primitive.fontSize[300],
    md: primitive.fontSize[400],
    lg: primitive.fontSize[500],
    xl: primitive.fontSize[600],
    xxl: primitive.fontSize[700],
    xxxl: primitive.fontSize[800],
  },
  weight: {
    regular: primitive.fontWeight[400],
    medium: primitive.fontWeight[500],
    semibold: primitive.fontWeight[600],
    bold: primitive.fontWeight[700],
  },
  lineHeight: {
    none: primitive.lineHeight[100],
    tight: primitive.lineHeight[200],
    normal: primitive.lineHeight[300],
  },
  letterSpacing: {
    wide: primitive.letterSpacing[100],
  },
} as const;

export const border = {
  width: {
    hairline: primitive.borderWidth[100],
    thin: primitive.borderWidth[200],
    regular: primitive.borderWidth[300],
  },
  radius: {
    sm: primitive.radius[100],
    md: primitive.radius[200],
    full: primitive.radius.full,
  },
} as const;
