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

import { getMupdf } from "../mupdf";
import type { LabelMaps } from "../types";
import { prepareGraftSource } from "./compress";
import { pdfDocumentToBase64 } from "./mupdfDocument";
import { applyPageRotation } from "./rotation";

export interface SavedPagesResult {
  combined: string;
  pages: Map<number, string>;
}

export function savePagesToBase64(
  pdfBytes: Uint8Array,
  maps: LabelMaps,
  totalPages: number,
  skipCompression = false,
): SavedPagesResult {
  const mupdf = getMupdf();
  const sourceDocument = new mupdf.PDFDocument(new Uint8Array(pdfBytes));
  const combinedDocument = new mupdf.PDFDocument();
  const pages = new Map<number, string>();

  try {
    for (let label = 1; label <= totalPages; label++) {
      const physicalIndex = maps.labelToPhysical.get(label);
      if (physicalIndex === undefined) continue;

      const rotation = maps.physicalToRotation.get(physicalIndex) ?? 0;
      const page = sourceDocument.loadPage(physicalIndex);
      applyPageRotation(page, rotation);

      // Downsamples in place of the graft source when this page's embedded
      // scan image is oversized (e.g. a 400-600 DPI phone capture); reads
      // the already-applied rotation above via getBounds()/toPixmap, which
      // reflect the page's /Rotate automatically. Callers on the Vertex
      // critical path skip this (skipCompression) and run
      // `compressOrderedPdf` afterward instead, off the path Vertex is
      // waiting on — compression only benefits GCS storage/view size, not
      // extraction correctness.
      const graft = prepareGraftSource(
        sourceDocument,
        physicalIndex,
        skipCompression,
      );

      try {
        const singlePageDocument = new mupdf.PDFDocument();
        try {
          singlePageDocument.graftPage(0, graft.document, graft.index);
          pages.set(label, pdfDocumentToBase64(singlePageDocument));
        } finally {
          singlePageDocument.destroy();
        }

        combinedDocument.graftPage(
          combinedDocument.countPages(),
          graft.document,
          graft.index,
        );
      } finally {
        graft.dispose();
      }
    }

    return {
      combined: pdfDocumentToBase64(combinedDocument),
      pages,
    };
  } finally {
    combinedDocument.destroy();
    sourceDocument.destroy();
  }
}

export function assemblePdfFromIndices(
  pdfBytes: Uint8Array,
  orderedPhysicalIndices: readonly number[],
): string {
  const mupdf = getMupdf();
  const sourceDocument = new mupdf.PDFDocument(new Uint8Array(pdfBytes));
  const outputDocument = new mupdf.PDFDocument();

  try {
    for (const physicalIndex of orderedPhysicalIndices) {
      outputDocument.graftPage(
        outputDocument.countPages(),
        sourceDocument,
        physicalIndex,
      );
    }
    return pdfDocumentToBase64(outputDocument);
  } finally {
    outputDocument.destroy();
    sourceDocument.destroy();
  }
}

export function extractSinglePageBase64(
  pdfBytes: Uint8Array,
  physicalIndex: number,
): string {
  const mupdf = getMupdf();
  const sourceDocument = new mupdf.PDFDocument(new Uint8Array(pdfBytes));
  const singlePageDocument = new mupdf.PDFDocument();

  try {
    singlePageDocument.graftPage(0, sourceDocument, physicalIndex);
    return pdfDocumentToBase64(singlePageDocument);
  } finally {
    singlePageDocument.destroy();
    sourceDocument.destroy();
  }
}
