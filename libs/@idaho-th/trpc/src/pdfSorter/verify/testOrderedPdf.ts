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

import {
  DEFAULT_TOTAL_PAGES,
  RENDER_DPI,
  VERIFICATION_STRIP_RATIO,
} from "../constants";
import { cropBottomStrip } from "../image/crop";
import { enhanceGrayscale } from "../image/grayscale";
import { toPgm } from "../image/pgm";
// NOTE: this is a standalone dev/verification utility (nothing in the server
// imports it). It deliberately uses the synchronous worker-side mupdf helpers
// directly and bootstraps mupdf itself via loadMupdf() — when run inside the
// server process this would put mupdf work on the calling thread, so keep it
// out of request paths.
import { loadMupdf } from "../mupdf";
import { buildPageLabelRegex } from "../ocr/pageLabel";
import { runTesseractOcr } from "../ocr/tesseract";
import { decodePdfFromBase64 } from "../pdf/document";
import { openPdfDocument } from "../pdf/mupdfDocument";
import { rasterizePage } from "../pdf/rasterize";
import { getPageRotationDegrees } from "../pdf/rotation";
import type {
  PageVerification,
  PdfTestReport,
  TestOrderedPdfOptions,
} from "../types";

type PdfDocument = ReturnType<typeof openPdfDocument>;

async function verifyPageAtIndex(
  pdfBytes: Uint8Array,
  document: PdfDocument,
  pageIndex: number,
  totalPages: number,
  labelRegex: RegExp,
): Promise<PageVerification> {
  const expectedLabel = pageIndex + 1;
  const page = document.loadPage(pageIndex);
  const rotationInPdf = getPageRotationDegrees(page);

  const raster = rasterizePage(pdfBytes, pageIndex, RENDER_DPI);
  const strip = cropBottomStrip(
    raster.pixels,
    raster.width,
    raster.height,
    VERIFICATION_STRIP_RATIO,
  );
  const pgm = toPgm(
    strip.width,
    strip.height,
    enhanceGrayscale(strip.data, strip.width, strip.height),
  );

  let ocrText = "";
  try {
    ocrText = await runTesseractOcr(pgm);
  } catch (error) {
    ocrText = `[OCR error: ${(error as Error).message}]`;
  }

  const match = ocrText.match(labelRegex);
  const capturedLabel = match?.[1];
  const detectedLabel =
    capturedLabel !== undefined ? parseInt(capturedLabel, 10) : null;

  return {
    pageIndex: expectedLabel,
    expectedLabel,
    detectedLabel,
    rotationInPdf,
    isCorrectLabel: detectedLabel === expectedLabel,
    isCorrectRotation: rotationInPdf === 0,
    ocrSnippet: ocrText.trim().replace(/\s+/g, " ").slice(0, 120),
  };
}

async function verifyPagesSequentially(
  pdfBytes: Uint8Array,
  document: PdfDocument,
  pageIndex: number,
  pageCount: number,
  totalPages: number,
  labelRegex: RegExp,
): Promise<PageVerification[]> {
  if (pageIndex >= pageCount) {
    return [];
  }

  const pageResult = await verifyPageAtIndex(
    pdfBytes,
    document,
    pageIndex,
    totalPages,
    labelRegex,
  );
  const remaining = await verifyPagesSequentially(
    pdfBytes,
    document,
    pageIndex + 1,
    pageCount,
    totalPages,
    labelRegex,
  );

  return [pageResult, ...remaining];
}

/**
 * Verifies that a combined PDF is in correct page order and orientation.
 * Each page should show "X of N" matching its 1-based position with /Rotate = 0.
 */
export async function testOrderedPdf(
  combinedBase64: string,
  options: TestOrderedPdfOptions = {},
): Promise<PdfTestReport> {
  const startedAt = performance.now();
  await loadMupdf();
  const totalPages = options.totalPages ?? DEFAULT_TOTAL_PAGES;
  const pdfBytes = decodePdfFromBase64(combinedBase64);
  const document = openPdfDocument(pdfBytes);
  const pageCount = document.countPages();
  const labelRegex = buildPageLabelRegex(totalPages);

  let pageResults: PageVerification[];

  try {
    pageResults = await verifyPagesSequentially(
      pdfBytes,
      document,
      0,
      pageCount,
      totalPages,
      labelRegex,
    );
  } finally {
    document.destroy();
  }

  const allPassed = pageResults.every(
    (page) => page.isCorrectLabel && page.isCorrectRotation,
  );
  const passCount = pageResults.filter(
    (page) => page.isCorrectLabel && page.isCorrectRotation,
  ).length;
  const elapsedMs = performance.now() - startedAt;

  const summary = allPassed
    ? `All ${pageCount} pages are in correct order and orientation.`
    : `${pageCount - passCount}/${pageCount} page(s) failed verification.`;

  return {
    passed: allPassed,
    totalPages: pageCount,
    pages: pageResults,
    summary,
    elapsedMs,
  };
}
