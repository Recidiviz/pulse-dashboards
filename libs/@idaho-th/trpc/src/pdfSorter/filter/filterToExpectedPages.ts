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

import { detectLabelOnOrientedPage } from "../detection/detectPageFromPdf";
import { selectKeptPagesFromDetections } from "../detection/selectKeptPages";
import { getMupdf } from "../mupdf";
import { decodePdfFromBase64 } from "../pdf/document";
import { getPdfPageCount, pdfDocumentToBase64 } from "../pdf/mupdfDocument";
import { extractSinglePageBase64 } from "../pdf/save";
import type { Base64Result, DetectResult } from "../types";

export interface FilterToExpectedPagesOptions {
  totalPages: number;
  detectionResults?: readonly DetectResult[];
}

async function scanOrientedPagesForLabels(
  pdfBytes: Uint8Array,
  pageCount: number,
  totalPages: number,
  physicalIndex: number,
  labelToOrientedIndex: Map<number, number>,
  ocrCallsSoFar: number,
): Promise<number> {
  if (physicalIndex >= pageCount) {
    return ocrCallsSoFar;
  }

  const detectedLabel = await detectLabelOnOrientedPage(
    pdfBytes,
    physicalIndex,
    totalPages,
  );
  const ocrCalls = ocrCallsSoFar + 1;

  if (detectedLabel !== null && !labelToOrientedIndex.has(detectedLabel)) {
    labelToOrientedIndex.set(detectedLabel, physicalIndex);
  }

  return scanOrientedPagesForLabels(
    pdfBytes,
    pageCount,
    totalPages,
    physicalIndex + 1,
    labelToOrientedIndex,
    ocrCalls,
  );
}

export async function filterToExpectedPages(
  orientedBase64: string,
  options: FilterToExpectedPagesOptions,
): Promise<Base64Result> {
  const startedAt = performance.now();
  const { totalPages, detectionResults } = options;
  const pdfBytes = decodePdfFromBase64(orientedBase64);
  const pageCount = getPdfPageCount(pdfBytes);

  const labelToOrientedIndex = new Map<number, number>();
  let totalOcrCalls = 0;

  if (detectionResults && detectionResults.length > 0) {
    const selection = selectKeptPagesFromDetections(
      detectionResults,
      totalPages,
    );
    for (const [label, orientedIndex] of selection.labelToOrientedIndex) {
      labelToOrientedIndex.set(label, orientedIndex);
    }
  } else {
    totalOcrCalls = await scanOrientedPagesForLabels(
      pdfBytes,
      pageCount,
      totalPages,
      0,
      labelToOrientedIndex,
      0,
    );
  }

  const sortedLabels = [...labelToOrientedIndex.keys()].sort((a, b) => a - b);
  const pages = new Map<number, string>();

  const mupdf = getMupdf();
  const outputDocument = new mupdf.PDFDocument();
  const sourceDocument = new mupdf.PDFDocument(new Uint8Array(pdfBytes));

  try {
    for (const label of sortedLabels) {
      const orientedIndex = labelToOrientedIndex.get(label);
      if (orientedIndex === undefined) continue;

      pages.set(label, extractSinglePageBase64(pdfBytes, orientedIndex));
      outputDocument.graftPage(
        outputDocument.countPages(),
        sourceDocument,
        orientedIndex,
      );
    }

    const combined = pdfDocumentToBase64(outputDocument);
    const elapsedMs = performance.now() - startedAt;

    return {
      combined,
      pages,
      detectionResults: [],
      metadata: {
        totalPages,
        totalOcrCalls,
        elapsedMs,
        detections: sortedLabels.flatMap((label) => {
          const physicalIndex = labelToOrientedIndex.get(label);
          if (physicalIndex === undefined) return [];
          return [
            {
              physicalIndex,
              label,
              rotation: 0,
              strategy: "filter-pass",
              ocrCalls: 0,
            },
          ];
        }),
      },
    };
  } finally {
    outputDocument.destroy();
    sourceDocument.destroy();
  }
}
