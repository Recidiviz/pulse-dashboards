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
// PRIMITIVE TOKENS — the raw, context-free palette and scales the SAR PDF is
// built from. These carry NO role meaning ("what is this for?"); they only name
// values along a numeric gradient ("how light? how big?"). UI components must
// NOT import from here — they consume the semantic layer (`./semantic`), which
// is the single place that assigns these values to roles. This one-way
// dependency (semantic → primitive, never the reverse) is the whole point of
// the two-tier split.
//
// Naming follows the Tailwind/Radix convention: numeric keys ascend with the
// quantity they measure (lightness for `gray`, magnitude for `space`/`fontSize`).
// Values are the canonical Figma measurements; near-duplicate greys and odd
// spacing/border values have been consolidated onto disciplined steps.
// -----------------------------------------------------------------------------

import { fonts } from "../fonts";

/**
 * Neutral ramp — light → dark. The SAR design is a tight black-on-white +
 * neutral-gray system, so this ramp carries almost the entire palette. Steps
 * absorb the former near-duplicate greys (e.g. `#CDCDCD`→200, `#505050`→600).
 */
export const gray = {
  50: "#F2F2F2",
  100: "#DFDFDF",
  200: "#D0D0D0",
  300: "#C5C5C5",
  400: "#B0B0B0",
  500: "#9F9F9F",
  600: "#595959",
} as const;

export const white = "#FFFFFF";
export const black = "#000000";

/**
 * Cool-grey accent family — deliberately kept OFF the neutral `gray` ramp
 * because it is a distinct (slightly blue) hue, not interchangeable with the
 * neutrals. Scoped to the info block, the strategy banners, and the info icon.
 */
export const slate = {
  50: "#F5F6F8",
  100: "#E9EDEE",
  400: "#9DB0B7",
} as const;

/** Translucent ink — the only non-opaque fill (faint progress-bar remainder). */
export const inkAlpha = {
  30: "rgba(0, 0, 0, 0.3)",
} as const;

/**
 * Spacing ramp (pt). Numeric keys ascend with magnitude. Odd one-off values
 * (1, 3, 5, 17, 18) have been snapped onto these steps.
 */
export const space = {
  0: 0,
  50: 2,
  100: 4,
  150: 6,
  200: 8,
  250: 10,
  300: 12,
  400: 16,
  500: 20,
  600: 24,
} as const;

/**
 * Page-frame margins (pt) — large one-off layout constants that sit apart from
 * the content rhythm ramp above.
 */
export const pageFrame = {
  top: 64,
  bottom: 48,
  x: 30,
} as const;

/**
 * Type ramp (pt). The half-steps (7.5 / 8.5 / 9.5) are intentional: at print
 * sizes the document relies on fine-grained gradations, so they are preserved
 * rather than snapped to whole points.
 */
export const fontSize = {
  50: 7,
  100: 7.5,
  200: 8,
  300: 8.5,
  400: 9,
  500: 9.5,
  600: 10,
  700: 11,
  800: 13,
} as const;

/** Weight axis — keys ARE the CSS numeric gradient. */
export const fontWeight = {
  400: 400,
  500: 500,
  600: 600,
  700: 700,
} as const;

/** Font families. */
export const fontFamily = {
  body: fonts.publicSans.family,
} as const;

/** Hairline → solid border weights (pt). `0.8` consolidated onto `0.75`. */
export const borderWidth = {
  100: 0.5,
  200: 0.75,
  300: 1,
} as const;

/** Corner radii (pt). `3`/`5` consolidated onto `4`; `full` is the pill sentinel. */
export const radius = {
  100: 2,
  200: 4,
  full: 999,
} as const;

/** Line-height multipliers. `1.35`/`1.45` consolidated onto `1.4`. */
export const lineHeight = {
  100: 1,
  200: 1.4,
  300: 1.5,
} as const;

/** Letter-spacing (pt) — the single tracked value, used on uppercase headings. */
export const letterSpacing = {
  100: 0.4,
} as const;
