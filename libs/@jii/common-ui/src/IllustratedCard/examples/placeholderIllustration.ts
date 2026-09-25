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

import { palette } from "~design-system";

/**
 * Stands in for a real illustration asset, so stories don't depend on anything
 * outside this library. The intrinsic size is the interesting part: a card
 * never draws its illustration wider than this, but will stretch it taller,
 * cropping to fit. The size is painted into the corner so it stays visible
 * in the story.
 */
export function placeholderIllustration(width: number, height: number) {
  const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="${width}" height="${height}" viewBox="0 0 ${width} ${height}">
    <rect width="${width}" height="${height}" fill="${palette.pine1}" />
    <rect x="12%" y="12%" width="76%" height="42%" rx="4" fill="${palette.pine2}" stroke="${palette.pine4}" />
    <rect x="12%" y="66%" width="46%" height="10%" rx="5" fill="${palette.pine4}" />
    <rect x="12%" y="82%" width="30%" height="10%" rx="5" fill="${palette.pine3}" />
    <text x="88%" y="88%" text-anchor="end" font-family="sans-serif" font-size="14" fill="${palette.marble1}">${width}x${height}</text>
  </svg>`;

  return `data:image/svg+xml,${encodeURIComponent(svg)}`;
}

/**
 * Placeholders of varying native size, for exercising how a card sizes its
 * illustration column. Intended for the `illustrationSrc` arg of a story.
 */
export const illustrationPlaceholders = {
  portrait: placeholderIllustration(206, 187),
  landscape: placeholderIllustration(400, 150),
  narrow: placeholderIllustration(110, 220),
};
