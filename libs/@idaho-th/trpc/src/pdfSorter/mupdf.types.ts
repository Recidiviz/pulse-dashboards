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

/** Minimal MuPDF typings for pdfSorter (mirrors the installed `mupdf` package). */

export interface MuPdfObject {
  isNull(): boolean;
  isNumber(): boolean;
  isName(): boolean;
  asNumber(): number;
  asName(): string;
  get(key: string): MuPdfObject | null;
  put(key: string, value: number): void;
  forEach(fn: (value: MuPdfObject, key: string | number) => void): void;
}

export interface MuPdfPage {
  toPixmap(matrix: unknown, colorSpace: unknown, alpha: boolean): MuPdfPixmap;
  getObject(): MuPdfObject;
  /** [x0, y0, x1, y1] in PDF points, already reflecting the page's /Rotate. */
  getBounds(): [number, number, number, number];
}

export interface MuPdfPixmap {
  getWidth(): number;
  getHeight(): number;
  getStride(): number;
  getPixels(): Uint8Array;
  asJPEG(quality: number, invertCmyk?: boolean): Uint8Array;
  destroy(): void;
}

export interface MuPdfBuffer {
  asUint8Array(): Uint8Array;
}

export declare class MuPdfImage {
  constructor(data: Uint8Array);
  getWidth(): number;
  getHeight(): number;
  destroy(): void;
}

export declare class PDFDocument {
  constructor(data?: Uint8Array);
  countPages(): number;
  loadPage(index: number): MuPdfPage;
  loadImage(ref: MuPdfObject): MuPdfImage;
  graftPage(
    destinationIndex: number,
    sourceDocument: PDFDocument,
    sourcePageIndex: number,
  ): void;
  addImage(image: MuPdfImage): MuPdfObject;
  addPage(
    mediabox: [number, number, number, number],
    rotate: number,
    resources: unknown,
    contents: string | Uint8Array,
  ): MuPdfObject;
  insertPage(at: number, obj: MuPdfObject): void;
  saveToBuffer(options: string): MuPdfBuffer;
  destroy(): void;
}

export interface MuPdfModule {
  PDFDocument: typeof PDFDocument;
  Image: typeof MuPdfImage;
  Matrix: { scale: (x: number, y: number) => unknown };
  ColorSpace: { DeviceGray: unknown; DeviceRGB: unknown };
}
