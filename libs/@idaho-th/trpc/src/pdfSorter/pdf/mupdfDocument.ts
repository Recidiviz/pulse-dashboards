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

// WORKER-SIDE ONLY — these helpers touch mupdf. main-thread code must never
// import this module; see mupdf.ts for why.

import { getMupdf } from "../mupdf";
import type { PDFDocument } from "../mupdf.types";

export function getPdfPageCount(pdfBytes: Uint8Array): number {
  const mupdf = getMupdf();
  const document = new mupdf.PDFDocument(new Uint8Array(pdfBytes));
  try {
    return document.countPages();
  } finally {
    document.destroy();
  }
}

export function pdfDocumentToBase64(document: PDFDocument): string {
  const buffer = document.saveToBuffer("");
  return Buffer.from(buffer.asUint8Array()).toString("base64");
}

export function openPdfDocument(pdfBytes: Uint8Array): PDFDocument {
  const mupdf = getMupdf();
  return new mupdf.PDFDocument(new Uint8Array(pdfBytes));
}
