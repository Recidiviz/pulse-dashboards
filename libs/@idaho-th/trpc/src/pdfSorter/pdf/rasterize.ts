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
import type { PageRaster } from "../types";

/** Opens its own PDFDocument (safe; no shared WASM state). */
export function rasterizePage(
  pdfBytes: Uint8Array,
  physicalIndex: number,
  dpi: number,
): PageRaster {
  const mupdf = getMupdf();
  const document = new mupdf.PDFDocument(new Uint8Array(pdfBytes));
  try {
    const page = document.loadPage(physicalIndex);
    const scale = dpi / 72;
    const pixmap = page.toPixmap(
      mupdf.Matrix.scale(scale, scale),
      mupdf.ColorSpace.DeviceGray,
      false,
    );

    try {
      const width = pixmap.getWidth();
      const height = pixmap.getHeight();
      const stride = pixmap.getStride();
      const raw = pixmap.getPixels();
      const pixels = new Uint8Array(width * height);

      if (stride === width) {
        pixels.set(raw.subarray(0, width * height));
      } else {
        for (let y = 0; y < height; y++) {
          pixels.set(raw.subarray(y * stride, y * stride + width), y * width);
        }
      }

      return { width, height, pixels };
    } finally {
      pixmap.destroy();
    }
  } finally {
    document.destroy();
  }
}
