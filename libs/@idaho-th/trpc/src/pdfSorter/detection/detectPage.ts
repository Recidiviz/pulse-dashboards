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

import { FALLBACK_STRATEGY, STRIP_STRATEGIES } from "../constants";
import { cropBottomStrip } from "../image/crop";
import { enhanceGrayscale, rotate180 } from "../image/grayscale";
import { toPgm } from "../image/pgm";
import { buildPageLabelRegex } from "../ocr/pageLabel";
import { runTesseractOcr } from "../ocr/tesseract";
import type { DetectResult, PageRaster } from "../types";

type StrategyMatch = {
  label: number;
  rotation: 0 | 180;
  strategy: string;
  ocrCalls: number;
  log: string[];
};

async function tryStrategiesSequentially(
  totalPages: number,
  raster: PageRaster,
  rotatedPixels: Uint8Array,
  strategyIndex: number,
  log: string[],
  ocrCalls: number,
): Promise<StrategyMatch | null> {
  const stripStrategy = STRIP_STRATEGIES[strategyIndex];
  if (stripStrategy === undefined) {
    return null;
  }

  const [use180Rotation, cropRatio] = stripStrategy;
  const { width, height, pixels } = raster;
  const source = use180Rotation ? rotatedPixels : pixels;
  const strip = cropBottomStrip(source, width, height, cropRatio);
  const pgm = toPgm(
    strip.width,
    strip.height,
    enhanceGrayscale(strip.data, strip.width, strip.height),
  );

  const text = await runTesseractOcr(pgm);
  const nextOcrCalls = ocrCalls + 1;

  const preview = text.trim().slice(0, 80).replace(/\s+/g, " ");
  const rotationTag = use180Rotation ? "rot180" : "rot0";
  const nextLog = [
    ...log,
    `    [${rotationTag}/ratio${cropRatio}] ${JSON.stringify(preview)}`,
  ];

  const labelRegex = buildPageLabelRegex(totalPages);
  const match = text.match(labelRegex);
  const capturedLabel = match?.[1];

  if (capturedLabel !== undefined) {
    return {
      label: parseInt(capturedLabel, 10),
      rotation: use180Rotation ? 180 : 0,
      strategy: `${rotationTag}/ratio${cropRatio}`,
      ocrCalls: nextOcrCalls,
      log: nextLog,
    };
  }

  return tryStrategiesSequentially(
    totalPages,
    raster,
    rotatedPixels,
    strategyIndex + 1,
    nextLog,
    nextOcrCalls,
  );
}

export async function detectPage(
  physicalIndex: number,
  totalPages: number,
  raster: PageRaster,
): Promise<DetectResult> {
  const { width, height, pixels } = raster;
  const rotatedPixels = rotate180(pixels, width, height);

  const match = await tryStrategiesSequentially(
    totalPages,
    raster,
    rotatedPixels,
    0,
    [],
    0,
  );

  if (match) {
    const log = [
      ...match.log,
      `  label=${match.label} rotation=${match.rotation}° strategy=${match.strategy} ocr_calls=${match.ocrCalls}`,
    ];
    return {
      physicalIndex,
      label: match.label,
      rotation: match.rotation,
      strategy: match.strategy,
      ocrCalls: match.ocrCalls,
      log,
    };
  }

  const label = physicalIndex + 1;
  const log = [
    "    All OCR strategies failed; using physical-order fallback.",
    `  label=${label} rotation=0° strategy=${FALLBACK_STRATEGY} ocr_calls=${STRIP_STRATEGIES.length}`,
  ];

  return {
    physicalIndex,
    label,
    rotation: 0,
    strategy: FALLBACK_STRATEGY,
    ocrCalls: STRIP_STRATEGIES.length,
    log,
  };
}
