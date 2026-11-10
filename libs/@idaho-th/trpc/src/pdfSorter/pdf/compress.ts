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
  IMAGE_COMPRESSION_DPI_TRIGGER_MULTIPLIER,
  IMAGE_COMPRESSION_JPEG_QUALITY,
  RENDER_DPI,
} from "../constants";
import { getMupdf } from "../mupdf";
import type { MuPdfPage, PDFDocument } from "../mupdf.types";
import { decodePdfFromBase64 } from "./document";
import { pdfDocumentToBase64 } from "./mupdfDocument";

type PdfDocument = PDFDocument;
type PdfPage = MuPdfPage;

/**
 * Highest effective DPI among this page's embedded raster images, or 0 if
 * it has none (e.g. a vector/text-only page). Computed from image pixel
 * dimensions against the page's point-size bounding box, so it reflects the
 * image's *effective* resolution as rendered on the page, not its native
 * resolution as stored in the file.
 */
function getMaxEmbeddedImageDpi(document: PdfDocument, page: PdfPage): number {
  const bounds = page.getBounds();
  const widthIn = (bounds[2] - bounds[0]) / 72;
  const heightIn = (bounds[3] - bounds[1]) / 72;
  if (widthIn <= 0 || heightIn <= 0) return 0;

  const resources = page.getObject().get("Resources");
  if (!resources || resources.isNull()) return 0;
  const xObjects = resources.get("XObject");
  if (!xObjects || xObjects.isNull()) return 0;

  let maxDpi = 0;
  xObjects.forEach((ref) => {
    const subtype = ref.get("Subtype");
    if (!subtype || !subtype.isName() || subtype.asName() !== "Image") return;

    const image = document.loadImage(ref);
    try {
      maxDpi = Math.max(
        maxDpi,
        image.getWidth() / widthIn,
        image.getHeight() / heightIn,
      );
    } finally {
      image.destroy();
    }
  });
  return maxDpi;
}

/**
 * Rasterizes and JPEG-recompresses a page down to `targetDpi` when its
 * embedded image resolution meaningfully exceeds that target (e.g. a
 * 400-600 DPI phone/scanner capture) — the same size/quality/DPI trade-off
 * a Ghostscript `-dPDFSETTINGS=/ebook`-style pipeline makes, done in-process
 * via the mupdf-wasm bindings already used elsewhere in pdfSorter, so it
 * stays inside the same worker-thread sandbox instead of shelling out to a
 * native binary (Ghostscript/mutool CLI) on not-yet-scanned bytes.
 *
 * Pages with no oversized embedded image (already at/under the target DPI,
 * or vector/text-only pages with no raster image at all) are left
 * untouched: rasterizing those would only add JPEG artifacts and, for a
 * text page, destroy the selectable text layer, with no size benefit.
 *
 * Returns a new single-page PDFDocument to graft the page from in place of
 * `sourceDocument`, or `null` if downsampling wasn't needed. The caller
 * owns the returned document's lifetime and must call `.destroy()` on it.
 */
export function downsamplePageIfOversized(
  sourceDocument: PdfDocument,
  physicalIndex: number,
  targetDpi: number = RENDER_DPI,
): PdfDocument | null {
  const mupdf = getMupdf();
  const page = sourceDocument.loadPage(physicalIndex);
  const maxDpi = getMaxEmbeddedImageDpi(sourceDocument, page);
  if (maxDpi <= targetDpi * IMAGE_COMPRESSION_DPI_TRIGGER_MULTIPLIER) {
    return null;
  }

  const scale = targetDpi / 72;
  const pixmap = page.toPixmap(
    mupdf.Matrix.scale(scale, scale),
    mupdf.ColorSpace.DeviceRGB,
    false,
  );

  try {
    const jpegBytes = pixmap.asJPEG(IMAGE_COMPRESSION_JPEG_QUALITY);
    const image = new mupdf.Image(jpegBytes);
    try {
      const outputDocument = new mupdf.PDFDocument();
      const imageRef = outputDocument.addImage(image);

      const bounds = page.getBounds();
      const width = bounds[2] - bounds[0];
      const height = bounds[3] - bounds[1];
      // Draws the image XObject scaled to fill the page's unit square, the
      // standard single-image PDF page content stream (same approach
      // Ghostscript/mutool use internally for image-only pages).
      const contents = `q ${width} 0 0 ${height} 0 0 cm /Im0 Do Q`;

      const pageRef = outputDocument.addPage(
        [0, 0, width, height],
        0,
        { XObject: { Im0: imageRef } },
        contents,
      );
      outputDocument.insertPage(0, pageRef);

      return outputDocument;
    } finally {
      image.destroy();
    }
  } finally {
    pixmap.destroy();
  }
}

export interface GraftSource {
  /** The document to graft from: `sourceDocument` itself, or a downsampled single-page replacement. */
  document: PdfDocument;
  /** The page index within `document` to graft. */
  index: number;
  /** Releases the downsampled replacement document, if one was created. Always call this once done grafting from `document`. */
  dispose: () => void;
}

/**
 * Downsamples `physicalIndex` of `sourceDocument` if its embedded image is
 * oversized, returning a `GraftSource` describing what to graft from instead
 * (the caller may need to graft the same source into more than one target
 * document, e.g. both a single-page and a combined PDF, without paying for
 * the downsample twice). Shared by `savePagesToBase64` and
 * `compressOrderedPdf`.
 */
export function prepareGraftSource(
  sourceDocument: PdfDocument,
  physicalIndex: number,
  skipCompression = false,
): GraftSource {
  const compressedPage = skipCompression
    ? null
    : downsamplePageIfOversized(sourceDocument, physicalIndex);

  return {
    document: compressedPage ?? sourceDocument,
    index: compressedPage ? 0 : physicalIndex,
    dispose: () => compressedPage?.destroy(),
  };
}

/**
 * Second-pass compression over a combined PDF that's already in its final
 * page order and orientation (produced by the fast, uncompressed prepare
 * path — see `PreparePdfForExtractionOptions.skipCompression`). Because
 * ordering/rotation are already resolved, this needs no label/rotation
 * maps: page N of the input is simply page N of the output, downsampled
 * independently. Intended to run as its own step after the ordered pages
 * have already been handed off (e.g. to Vertex), not before.
 */
export function compressOrderedPdf(combinedBase64: string): string {
  const mupdf = getMupdf();
  const pdfBytes = decodePdfFromBase64(combinedBase64);
  const sourceDocument = new mupdf.PDFDocument(new Uint8Array(pdfBytes));
  const combinedDocument = new mupdf.PDFDocument();

  try {
    const pageCount = sourceDocument.countPages();
    for (let physicalIndex = 0; physicalIndex < pageCount; physicalIndex++) {
      const graft = prepareGraftSource(sourceDocument, physicalIndex);
      try {
        combinedDocument.graftPage(
          combinedDocument.countPages(),
          graft.document,
          graft.index,
        );
      } finally {
        graft.dispose();
      }
    }

    return pdfDocumentToBase64(combinedDocument);
  } finally {
    combinedDocument.destroy();
    sourceDocument.destroy();
  }
}
