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

import type { Styles } from "@react-pdf/renderer";

// The template consumes the raw tRPC responses directly — no bespoke PDF
// schema. `SAR` is the getSAR output; `SARInsight` is the getSARInsight output
// (Historical Outcome). Re-exported here so template components import a single
// local type module.
export type { SAR, SARInsight } from "../../../api";

/**
 * Optional style override every template component accepts; merged after the
 * component's inherent style in the `style={[...]}` array, so caller wins.
 */
export type PdfStyle = Styles[string];

/**
 * How a donut slice / legend chip is filled. Solid grays (`light`/`mid`/`dark`/
 * `black`) plus four white-on-dark textures (`stripes`/`dots`/`crosshatch`/
 * `plus`). `empty` is the 0%/fallback white chip. Presentation-only — not a
 * data shape. Slice geometry + legend chip both render from these via
 * `glyphTexture`.
 */
export type LegendGlyph =
  | "light"
  | "mid"
  | "dark"
  | "black"
  | "stripes"
  | "dots"
  | "crosshatch"
  | "plus"
  | "empty";

/**
 * One donut slice / legend row — already-derived presentation data (label,
 * percentage, and which texture glyph represents it). Built by
 * HistoricalOutcomeBlock from the raw insight disposition data.
 */
export interface SentenceDistributionItem {
  label: string;
  pct: number;
  glyph: LegendGlyph;
}
