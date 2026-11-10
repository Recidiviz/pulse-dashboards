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

// Pure base64/byte helpers — safe on the main thread. The mupdf-touching
// document helpers (getPdfPageCount, pdfDocumentToBase64, openPdfDocument)
// live in ./mupdfDocument, which is worker-side only.

export function decodePdfFromBase64(base64: string): Uint8Array {
  return new Uint8Array(Buffer.from(base64, "base64"));
}

export function encodePdfToBase64(pdfBytes: Uint8Array): string {
  return Buffer.from(pdfBytes).toString("base64");
}
