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

export interface CroppedStrip {
  data: Uint8Array;
  width: number;
  height: number;
}

/** PIL crop(0, floor(height * ratio), width, height). */
export function cropBottomStrip(
  source: Uint8Array,
  width: number,
  height: number,
  startRatio: number,
): CroppedStrip {
  const y0 = Math.floor(height * startRatio);
  const stripHeight = height - y0;
  const strip = new Uint8Array(width * stripHeight);

  for (let y = 0; y < stripHeight; y++) {
    strip.set(
      source.subarray((y0 + y) * width, (y0 + y) * width + width),
      y * width,
    );
  }

  return { data: strip, width, height: stripHeight };
}
