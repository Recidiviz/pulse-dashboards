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

import { performance } from "node:perf_hooks";

import { runPool } from "../concurrency/runPool";
import {
  DEFAULT_TOTAL_PAGES,
  MAX_OCR_WORKERS,
  MAX_ORDERING_PAGE_COUNT,
  RENDER_DPI,
} from "../constants";
import { buildLabelToPhysicalMaps } from "../detection/buildLabelMaps";
import { detectPage } from "../detection/detectPage";
import { PdfProcessingError } from "../errors";
import { decodePdfFromBase64 } from "../pdf/document";
import { getPdfPageCount } from "../pdf/mupdfDocument";
import { rasterizePage } from "../pdf/rasterize";
import { savePagesToBase64 } from "../pdf/save";
import type { Base64Result, PageRaster, SortAndSplitOptions } from "../types";

/**
 * Corrects page order and orientation for a base64-encoded PDF entirely in memory.
 * Returns individual pages, a combined ordered PDF, and raw detection results
 * for downstream filtering without re-running OCR.
 */
export async function sortAndSplitFromBase64(
  base64: string,
  options: SortAndSplitOptions = {},
): Promise<Base64Result> {
  const startedAt = performance.now();
  const totalPages = options.totalPages ?? DEFAULT_TOTAL_PAGES;
  const pdfBytes = decodePdfFromBase64(base64);
  const pageCount = getPdfPageCount(pdfBytes);

  if (pageCount > MAX_ORDERING_PAGE_COUNT) {
    throw new PdfProcessingError(
      `PDF has ${String(pageCount)} pages, which exceeds the ${String(MAX_ORDERING_PAGE_COUNT)}-page limit for ordering/orientation`,
      { userCaused: true },
    );
  }

  const rasters: PageRaster[] = [];
  for (let physicalIndex = 0; physicalIndex < pageCount; physicalIndex++) {
    rasters.push(rasterizePage(pdfBytes, physicalIndex, RENDER_DPI));
  }

  const maxWorkers = Math.min(pageCount, MAX_OCR_WORKERS);
  const detectionResults = await runPool(
    pageCount,
    maxWorkers,
    (physicalIndex) => {
      const raster = rasters[physicalIndex];
      if (raster === undefined) {
        throw new PdfProcessingError(
          `Missing raster for physical page ${physicalIndex + 1}`,
        );
      }
      return detectPage(physicalIndex, totalPages, raster);
    },
  );

  const totalOcrCalls = detectionResults.reduce(
    (sum, result) => sum + result.ocrCalls,
    0,
  );

  const maps = buildLabelToPhysicalMaps(
    detectionResults,
    totalPages,
    pageCount,
  );

  const { combined, pages } = savePagesToBase64(
    pdfBytes,
    maps,
    totalPages,
    options.skipCompression,
  );
  const elapsedMs = performance.now() - startedAt;

  return {
    combined,
    pages,
    detectionResults,
    metadata: {
      totalPages,
      totalOcrCalls,
      elapsedMs,
      detections: detectionResults.map((result) => ({
        physicalIndex: result.physicalIndex,
        label: result.label,
        rotation: result.rotation,
        strategy: result.strategy,
        ocrCalls: result.ocrCalls,
      })),
    },
  };
}
