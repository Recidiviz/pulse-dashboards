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

function clampByte(v: number): number {
  return Math.min(255, Math.max(0, v));
}

function clampAxis(v: number, max: number): number {
  if (v < 0) return 0;
  if (v >= max) return max - 1;
  return v;
}

function readPixel(data: Uint8Array, index: number): number {
  return data[index] ?? 0;
}

function computeMean(source: Uint8Array): number {
  let sum = 0;
  for (let i = 0; i < source.length; i++) sum += source[i];
  return Math.round(sum / source.length);
}

function applyContrast(source: Uint8Array, mean: number): Uint8Array {
  const mean2 = mean * 2;
  const out = new Uint8Array(source.length);
  for (let i = 0; i < source.length; i++) {
    out[i] = clampByte(source[i] * 3 - mean2);
  }
  return out;
}

function sharpenBorderPixel(
  src: Uint8Array,
  width: number,
  height: number,
  x: number,
  y: number,
): number {
  const row = clampAxis(y, height) * width;
  const rowN = clampAxis(y - 1, height) * width;
  const rowS = clampAxis(y + 1, height) * width;
  const xW = clampAxis(x - 1, width);
  const xE = clampAxis(x + 1, width);

  const acc =
    (src[row + x] << 5) -
    (src[rowN + xW] +
      src[rowN + x] +
      src[rowN + xE] +
      src[row + xW] +
      src[row + xE] +
      src[rowS + xW] +
      src[rowS + x] +
      src[rowS + xE]) *
      2;

  return clampByte(acc >> 4);
}

function applySharpening(
  src: Uint8Array,
  width: number,
  height: number,
): Uint8Array {
  const out = new Uint8Array(width * height);
  const maxX = width - 1;
  const maxY = height - 1;

  // Interior pixels — no clamping, unrolled kernel, bit-shift instead of divide
  for (let y = 1; y < maxY; y++) {
    const row = y * width;
    const rowN = row - width;
    const rowS = row + width;
    for (let x = 1; x < maxX; x++) {
      const i = row + x;
      const acc =
        (src[i] << 5) -
        (src[rowN + x - 1] +
          src[rowN + x] +
          src[rowN + x + 1] +
          src[row + x - 1] +
          src[row + x + 1] +
          src[rowS + x - 1] +
          src[rowS + x] +
          src[rowS + x + 1]) *
          2;
      out[i] = clampByte(acc >> 4);
    }
  }

  for (let x = 0; x < width; x++) {
    out[x] = sharpenBorderPixel(src, width, height, x, 0);
    out[maxY * width + x] = sharpenBorderPixel(src, width, height, x, maxY);
  }
  for (let y = 1; y < maxY; y++) {
    out[y * width] = sharpenBorderPixel(src, width, height, 0, y);
    out[y * width + maxX] = sharpenBorderPixel(src, width, height, maxX, y);
  }

  return out;
}

export function enhanceGrayscale(
  source: Uint8Array,
  width: number,
  height: number,
): Uint8Array {
  const mean = computeMean(source);
  const contrasted = applyContrast(source, mean);
  return applySharpening(contrasted, width, height);
}

export function rotate180(
  source: Uint8Array,
  width: number,
  height: number,
): Uint8Array {
  const rotated = new Uint8Array(width * height);
  for (let y = 0; y < height; y++) {
    const sourceY = height - 1 - y;
    for (let x = 0; x < width; x++) {
      const sourceIndex = sourceY * width + (width - 1 - x);
      rotated[y * width + x] = readPixel(source, sourceIndex);
    }
  }
  return rotated;
}
