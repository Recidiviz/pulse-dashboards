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

import { RENDER_DPI, STRIP_STRATEGIES } from "../constants";
import { cropBottomStrip } from "../image/crop";
import { enhanceGrayscale, rotate180 } from "../image/grayscale";
import { toPgm } from "../image/pgm";
import { buildPageLabelRegex } from "../ocr/pageLabel";
import { runTesseractOcr } from "../ocr/tesseract";
import { rasterizePage } from "../pdf/rasterize";
import type { PageRaster } from "../types";

async function tryOrientedPageStrategies(
  raster: PageRaster,
  rotatedPixels: Uint8Array,
  labelRegex: RegExp,
  strategyIndex: number,
): Promise<number | null> {
  const stripStrategy = STRIP_STRATEGIES[strategyIndex];
  if (stripStrategy === undefined) {
    return null;
  }

  const [use180Rotation, cropRatio] = stripStrategy;
  const source = use180Rotation ? rotatedPixels : raster.pixels;
  const strip = cropBottomStrip(source, raster.width, raster.height, cropRatio);
  const pgm = toPgm(
    strip.width,
    strip.height,
    enhanceGrayscale(strip.data, strip.width, strip.height),
  );

  try {
    const text = await runTesseractOcr(pgm);
    const capturedLabel = text.match(labelRegex)?.[1];
    if (capturedLabel !== undefined) {
      return parseInt(capturedLabel, 10);
    }
  } catch {
    // Tesseract failed for this strategy; try the next one.
  }

  return tryOrientedPageStrategies(
    raster,
    rotatedPixels,
    labelRegex,
    strategyIndex + 1,
  );
}

export async function detectLabelOnOrientedPage(
  pdfBytes: Uint8Array,
  physicalIndex: number,
  totalPages: number,
): Promise<number | null> {
  const labelRegex = buildPageLabelRegex(totalPages);
  const raster = rasterizePage(pdfBytes, physicalIndex, RENDER_DPI);
  const rotatedPixels = rotate180(raster.pixels, raster.width, raster.height);

  return tryOrientedPageStrategies(raster, rotatedPixels, labelRegex, 0);
}
