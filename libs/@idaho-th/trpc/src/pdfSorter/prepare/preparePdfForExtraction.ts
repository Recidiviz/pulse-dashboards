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

import {
  DEFAULT_TOTAL_PAGES,
  PDF_OUTPUT_MODE,
  type PdfOutputMode,
} from "../constants";
import { filterToExpectedPages } from "../filter/filterToExpectedPages";
import { decodePdfFromBase64 } from "../pdf/document";
import { getPdfPageCount } from "../pdf/mupdfDocument";
import { sortAndSplitFromBase64 } from "../sort/sortAndSplitFromBase64";

export interface PreparePdfForExtractionOptions {
  totalPages?: number;
  outputMode?: PdfOutputMode;
  /**
   * Skips the per-page downsample/recompress pass (see pdf/compress.ts).
   * Compression only benefits GCS storage/view size, not extraction
   * correctness, so callers on a latency-sensitive path to Vertex (which
   * only needs correct order/rotation) can set this and run
   * `compressOrderedPdf` afterward, off the path Vertex is waiting on.
   */
  skipCompression?: boolean;
}

export interface PreparedPdfForExtraction {
  perPageBase64: Array<string | undefined>;
  combinedBase64?: string;
  missingPageNumbers: number[];
}

function hasCompletePageMap(
  pages: Map<number, string>,
  totalPages: number,
): boolean {
  for (let pageNumber = 1; pageNumber <= totalPages; pageNumber++) {
    if (!pages.has(pageNumber)) return false;
  }
  return true;
}

function pagesMapToOrderedArray(
  pages: Map<number, string>,
  totalPages: number,
): {
  perPageBase64: Array<string | undefined>;
  missingPageNumbers: number[];
} {
  const perPageBase64: Array<string | undefined> = [];
  const missingPageNumbers: number[] = [];

  for (let pageNumber = 1; pageNumber <= totalPages; pageNumber++) {
    const pageBase64 = pages.get(pageNumber);
    if (pageBase64 === undefined) {
      perPageBase64.push(undefined);
      missingPageNumbers.push(pageNumber);
    } else {
      perPageBase64.push(pageBase64);
    }
  }

  return { perPageBase64, missingPageNumbers };
}

/**
 * Corrects page order and orientation, filters to expected pages, and returns
 * base64 PDFs ready for downstream processing (e.g., Vertex per page extraction).
 */
export async function preparePdfForExtraction(
  pdfBase64: string,
  options: PreparePdfForExtractionOptions = {},
): Promise<PreparedPdfForExtraction> {
  const totalPages = options.totalPages ?? DEFAULT_TOTAL_PAGES;
  const outputMode = options.outputMode ?? PDF_OUTPUT_MODE.PER_PAGE;

  const pdfBytes = decodePdfFromBase64(pdfBase64);
  const sourcePageCount = getPdfPageCount(pdfBytes);

  const oriented = await sortAndSplitFromBase64(pdfBase64, {
    totalPages,
    skipCompression: options.skipCompression,
  });

  // Filter drops fallback-only pages (junk extras). For a 4-page form with no
  // extras, sort already produced all pages — filtering would discard valid pages
  // when footer OCR fails and every page is marked as fallback.
  const skipFilter =
    sourcePageCount === totalPages &&
    hasCompletePageMap(oriented.pages, totalPages);

  let preparedPages: Map<number, string>;
  let preparedCombined: string;

  if (skipFilter) {
    preparedPages = oriented.pages;
    preparedCombined = oriented.combined;
  } else {
    const filtered = await filterToExpectedPages(oriented.combined, {
      totalPages,
      detectionResults: oriented.detectionResults,
    });
    preparedPages = filtered.pages;
    preparedCombined = filtered.combined;
  }

  const { perPageBase64, missingPageNumbers } = pagesMapToOrderedArray(
    preparedPages,
    totalPages,
  );

  const needsCombined =
    outputMode === PDF_OUTPUT_MODE.COMBINED ||
    outputMode === PDF_OUTPUT_MODE.BOTH;
  const needsPerPage =
    outputMode === PDF_OUTPUT_MODE.PER_PAGE ||
    outputMode === PDF_OUTPUT_MODE.BOTH;

  const prepared: PreparedPdfForExtraction = {
    perPageBase64: needsPerPage ? perPageBase64 : [],
    combinedBase64: needsCombined ? preparedCombined : undefined,
    missingPageNumbers,
  };

  return prepared;
}
