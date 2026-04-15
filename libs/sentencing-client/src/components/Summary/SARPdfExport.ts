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

import { palette } from "~design-system";

import {
  CONTINUATION_HEADER_CLASS,
  NO_SPLIT_CLASS,
  PAGE_START_CLASS,
} from "./SentencingAssessmentReport.constants";

// Structural type matching the subset of jsPDF methods we use.
// Avoids a hard dependency on jsPDF's type declarations in this module.
interface PdfPage {
  addImage(
    data: string,
    format: string,
    x: number,
    y: number,
    w: number,
    h: number,
  ): unknown;
  setFillColor(r: number, g: number, b: number): unknown;
  rect(x: number, y: number, w: number, h: number, style: string): unknown;
}

type BlockBound = { top: number; bottom: number };

type PageDimensions = {
  pageWidth: number;
  pageHeight: number;
  headerMM: number;
  footerMM: number;
  bodyMM: number;
};

type PageImages = {
  header: string;
  body: string;
  footer: string;
};

const CANVAS_SCALE = 2;
const JPEG_QUALITY = 0.9;

// JPEG's 8×8 DCT blocks can spread a card's border/background color up to
// ~1 mm above its geometric boundary after encoding. Snapping the cut this
// far before a no-split block's top ensures the white mask on the previous
// page fully covers any such bleed. The inset lands within the ~8 mm
// inter-block gap, so no visible content is affected.
const SNAP_INSET_MM = 1.0;

const HTML2CANVAS_OPTS = {
  scale: CANVAS_SCALE,
  useCORS: true,
  logging: false,
  backgroundColor: palette.white,
};

/**
 * Shared conversion context for a tbody measurement pass.
 * Avoids recomputing tbodyRect / mmPerCSSPx across multiple helpers.
 */
function getTbodyMeasurementContext(
  tbodyEl: HTMLElement,
  pageWidthMM: number,
): { tbodyRect: DOMRect; mmPerCSSPx: number } {
  const tbodyRect = tbodyEl.getBoundingClientRect();
  // getBoundingClientRect().width is more reliable than offsetWidth on <tbody>.
  return { tbodyRect, mmPerCSSPx: pageWidthMM / tbodyRect.width };
}

/**
 * Measures each .sar-no-split element's top/bottom position relative to
 * the tbody, converting CSS pixels to PDF millimetres.
 *
 * Must be called BEFORE html2canvas — canvas capture can shift DOM layout,
 * making post-capture getBoundingClientRect unreliable.
 */
function measureNoSplitBlocks(
  tbodyEl: HTMLElement,
  pageWidthMM: number,
): BlockBound[] {
  const { tbodyRect, mmPerCSSPx } = getTbodyMeasurementContext(
    tbodyEl,
    pageWidthMM,
  );

  return Array.from(
    tbodyEl.querySelectorAll<HTMLElement>(`.${NO_SPLIT_CLASS}`),
  ).map((el) => {
    const { top, bottom } = el.getBoundingClientRect();
    return {
      top: (top - tbodyRect.top) * mmPerCSSPx,
      bottom: (bottom - tbodyRect.top) * mmPerCSSPx,
    };
  });
}

/**
 * Measures the top position (in MM) of each .sar-page-start element relative
 * to the tbody. These positions are used to force page cuts immediately before
 * the element so it always begins at the top of a page.
 *
 * Must be called BEFORE html2canvas for the same reason as measureNoSplitBlocks.
 */
function measurePageStartPositions(
  tbodyEl: HTMLElement,
  pageWidthMM: number,
): number[] {
  const { tbodyRect, mmPerCSSPx } = getTbodyMeasurementContext(
    tbodyEl,
    pageWidthMM,
  );

  return Array.from(
    tbodyEl.querySelectorAll<HTMLElement>(`.${PAGE_START_CLASS}`),
  ).map((el) => (el.getBoundingClientRect().top - tbodyRect.top) * mmPerCSSPx);
}

type ContinuationHeader = {
  element: HTMLElement;
  /** Top of the continuation heading, in MM from the tbody top. */
  headerTop: number;
  /** Bottom of the preceding primary section, in MM from the tbody top. */
  primaryBottom: number;
};

/**
 * Finds every .sar-continuation-header element and records:
 * - the top of its enclosing sar-no-split block (so we know where the cut must
 *   land for this heading to appear on the new page), and
 * - the bottom of the preceding .sar-no-split sibling (the primary section).
 *
 * Using the block's top rather than the element's own top means this function
 * can be called while the header elements are display:none (the block is still
 * in the layout; only its height shrinks). Both values are equivalent when the
 * header is visible because the header is always the first child of its block.
 */
function measureContinuationHeaders(
  tbodyEl: HTMLElement,
  pageWidthMM: number,
): ContinuationHeader[] {
  const { tbodyRect, mmPerCSSPx } = getTbodyMeasurementContext(
    tbodyEl,
    pageWidthMM,
  );
  const result: ContinuationHeader[] = [];

  for (const el of Array.from(
    tbodyEl.querySelectorAll<HTMLElement>(`.${CONTINUATION_HEADER_CLASS}`),
  )) {
    // Walk up to find the continuation section's no-split block, then find
    // the nearest preceding no-split sibling (the primary section).
    const continuationSection = el.closest(`.${NO_SPLIT_CLASS}`);
    if (!(continuationSection instanceof HTMLElement)) continue;

    // Use the block's top, not the element's top. The element returns a zero
    // rect when display:none; the block remains in layout with the same top
    // position (hiding the element shrinks the block height, not its top).
    const headerTop =
      (continuationSection.getBoundingClientRect().top - tbodyRect.top) *
      mmPerCSSPx;

    let prev = continuationSection.previousElementSibling as HTMLElement | null;
    while (prev && !prev.classList.contains(NO_SPLIT_CLASS)) {
      prev = prev.previousElementSibling as HTMLElement | null;
    }
    if (!prev) continue;

    const primaryBottom =
      (prev.getBoundingClientRect().bottom - tbodyRect.top) * mmPerCSSPx;
    result.push({ element: el, headerTop, primaryBottom });
  }

  return result;
}

/** Converts a canvas to mm height, preserving the aspect ratio at pageWidth. */
function canvasHeightToMM(
  canvas: HTMLCanvasElement,
  pageWidthMM: number,
): number {
  return (canvas.height * pageWidthMM) / canvas.width;
}

/** Encodes a canvas as a JPEG data URL at the standard export quality. */
function canvasToJpeg(canvas: HTMLCanvasElement): string {
  return canvas.toDataURL("image/jpeg", JPEG_QUALITY);
}

/**
 * Determines where a page should end.
 *
 * 1. Start at the natural cut (bodyOffset + sliceMM).
 * 2. Snap back to the top of the first no-split block that straddles the cut.
 * 3. Snap back further to any page-start element within the page's range,
 *    ensuring it always begins at the top of the next page.
 * 4. Guard: if a block is taller than a full slice, force-advance to avoid an
 *    infinite loop.
 */
function computePageCutPoint(
  bodyOffset: number,
  sliceMM: number,
  bodyMM: number,
  blocks: BlockBound[],
  pageStartPositions: number[],
): number {
  let cutPoint = Math.min(bodyOffset + sliceMM, bodyMM);

  // Snap back to just before the first no-split block that straddles the cut.
  // Use an inset rather than the exact block top so the white mask on the
  // previous page covers any JPEG DCT bleed from the card's border/background.
  for (const block of blocks) {
    if (
      block.top < cutPoint &&
      block.bottom > cutPoint &&
      block.top > bodyOffset
    ) {
      const insetSnap = block.top - SNAP_INSET_MM;
      cutPoint = insetSnap > bodyOffset ? insetSnap : block.top;
      break;
    }
  }

  // Snap back further to the first page-start element within this page's range.
  // Positions are in DOM (top-to-bottom) order so the first match is correct.
  for (const pos of pageStartPositions) {
    if (pos > bodyOffset && pos < cutPoint) {
      cutPoint = pos;
      break;
    }
  }

  // Guard: block is taller than a full page slice — force-advance to avoid an infinite loop.
  if (cutPoint <= bodyOffset) cutPoint = bodyOffset + sliceMM;

  return cutPoint;
}

/**
 * Composites one PDF page: body canvas (offset to show the correct slice),
 * white mask to hide content past the cut point, then header and footer on top.
 */
function renderPdfPage(
  page: PdfPage,
  images: PageImages,
  dims: PageDimensions,
  bodyOffset: number,
  cutPoint: number,
): void {
  const { pageWidth, pageHeight, headerMM, footerMM, bodyMM } = dims;

  // Place the full body canvas shifted so the current slice fills the content zone.
  page.addImage(
    images.body,
    "JPEG",
    0,
    headerMM - bodyOffset,
    pageWidth,
    bodyMM,
  );

  // Mask body content beyond the cut point so it doesn't bleed into this page's footer area.
  // The next page will start at bodyOffset=cutPoint, so overlap must be hidden here.
  const cutLineY = headerMM + cutPoint - bodyOffset;
  const contentBottomY = pageHeight - footerMM;
  if (cutLineY < contentBottomY) {
    page.setFillColor(255, 255, 255);
    page.rect(0, cutLineY, pageWidth, contentBottomY - cutLineY, "F");
  }

  // Header and footer paint last so they always cover any body overflow.
  page.addImage(images.header, "JPEG", 0, 0, pageWidth, headerMM);
  page.addImage(
    images.footer,
    "JPEG",
    0,
    pageHeight - footerMM,
    pageWidth,
    footerMM,
  );
}

/**
 * Computes all page cut points in one pass. Each value is the bodyMM offset
 * where the corresponding page ends (and the next page begins).
 *
 * Returning the full array (rather than just a count) means the render loop
 * can iterate it directly instead of recomputing the same offsets a second time.
 */
function computePageCutPoints(
  bodyMM: number,
  sliceMM: number,
  blocks: BlockBound[],
  pageStartPositions: number[],
): number[] {
  const cutPoints: number[] = [];
  let offset = 0;
  while (offset < bodyMM) {
    offset = computePageCutPoint(
      offset,
      sliceMM,
      bodyMM,
      blocks,
      pageStartPositions,
    );
    cutPoints.push(offset);
  }
  return cutPoints;
}

/**
 * Captures a footer image for each PDF page, injecting the current page
 * number into the [data-sar-page-number] placeholder before each capture.
 *
 * This ensures the page number renders with the same typography, size, and
 * padding as the rest of the footer rather than being stamped as a jsPDF
 * text overlay in a different font.
 *
 * The placeholder is restored to a non-breaking space afterwards so it keeps
 * its line height on screen.
 */
async function captureFooterImagesPerPage(
  tfootEl: HTMLElement,
  totalPages: number,
): Promise<string[]> {
  const { default: html2canvas } = await import("html2canvas");
  const pageNumberEl = tfootEl.querySelector<HTMLElement>(
    "[data-sar-page-number]",
  );

  const images: string[] = [];
  for (let i = 1; i <= totalPages; i++) {
    if (pageNumberEl) pageNumberEl.textContent = `Page ${i}`;
    // Sequential awaits are required: the DOM must be mutated between captures
    // so each footer image contains the correct page number.
    // eslint-disable-next-line no-await-in-loop
    const canvas = await html2canvas(tfootEl, HTML2CANVAS_OPTS);
    images.push(canvasToJpeg(canvas));
  }

  // Restore placeholder so the element keeps its line height on screen.
  if (pageNumberEl) pageNumberEl.textContent = "\u00a0";

  return images;
}

/** Generates and saves the SAR as a paginated PDF file. */
export async function exportSARtoPDF(
  container: HTMLElement,
  fileName: string,
): Promise<void> {
  const table = container.querySelector("table");
  if (!table) return;

  const { default: jsPDF } = await import("jspdf");
  const { default: html2canvas } = await import("html2canvas");

  const pdf = new jsPDF({ orientation: "portrait", unit: "mm", format: "a4" });
  const pageWidth = pdf.internal.pageSize.getWidth();
  const pageHeight = pdf.internal.pageSize.getHeight();

  const tbodyEl = table.querySelector("tbody") as HTMLElement;
  const tfootEl = table.querySelector("tfoot") as HTMLElement;

  // Capture header and footer first so we know sliceMM before touching the body.
  const [headerCanvas, footerCanvas] = await Promise.all([
    html2canvas(table.querySelector("thead") as HTMLElement, HTML2CANVAS_OPTS),
    html2canvas(tfootEl, HTML2CANVAS_OPTS),
  ]);
  const headerMM = canvasHeightToMM(headerCanvas, pageWidth);
  const footerMM = canvasHeightToMM(footerCanvas, pageWidth);
  const sliceMM = pageHeight - headerMM - footerMM;

  // Hide ALL continuation headings first so block measurements are accurate
  // (not inflated by heading heights). Measuring with all headings visible causes
  // phantom cut points that make headings appear on the wrong page.
  const allContinuationHeaderEls = Array.from(
    tbodyEl.querySelectorAll<HTMLElement>(`.${CONTINUATION_HEADER_CLASS}`),
  );
  for (const el of allContinuationHeaderEls) el.style.display = "none";

  // Must be called BEFORE html2canvas — canvas capture can shift layout.
  const { mmPerCSSPx } = getTbodyMeasurementContext(tbodyEl, pageWidth);

  // Iteratively converge on the correct set of continuation headers to show.
  // Each pass re-evaluates every header against the current cut points. Showing
  // or hiding a header changes block heights, which shifts subsequent blocks and
  // alters cut points — so we repeat until the desired set is stable.
  // Headers are both added AND removed each pass; a one-way "only add" approach
  // gets stuck when an earlier section's newly-shown headers shift later blocks
  // onto different page boundaries. The bound of 10 passes prevents infinite
  // loops in pathological edge cases (convergence is typically 2–3 passes).
  let blocks = measureNoSplitBlocks(tbodyEl, pageWidth);
  let pageStartPositions = measurePageStartPositions(tbodyEl, pageWidth);
  let shownHeaders = new Set<HTMLElement>();

  for (let pass = 0; pass < 10; pass++) {
    const bodyHeight = tbodyEl.getBoundingClientRect().height * mmPerCSSPx;
    const cutPointsCurrent = computePageCutPoints(
      bodyHeight,
      sliceMM,
      blocks,
      pageStartPositions,
    );

    const desiredHeaders = new Set<HTMLElement>();
    for (const h of measureContinuationHeaders(tbodyEl, pageWidth)) {
      const splitsBefore = cutPointsCurrent.some(
        (cp) => cp >= h.primaryBottom && cp <= h.headerTop,
      );
      if (splitsBefore) desiredHeaders.add(h.element);
    }

    // Capture in a const so the closure below doesn't reference a reassigned `let`.
    const prevHeaders = shownHeaders;
    const converged =
      desiredHeaders.size === prevHeaders.size &&
      [...desiredHeaders].every((el) => prevHeaders.has(el));
    if (converged) break;

    for (const el of allContinuationHeaderEls) {
      el.style.display = desiredHeaders.has(el) ? "" : "none";
    }
    shownHeaders = desiredHeaders;

    blocks = measureNoSplitBlocks(tbodyEl, pageWidth);
    pageStartPositions = measurePageStartPositions(tbodyEl, pageWidth);
  }

  const bodyCanvas = await html2canvas(tbodyEl, HTML2CANVAS_OPTS);

  for (const el of allContinuationHeaderEls) el.style.display = "";

  const bodyMM = canvasHeightToMM(bodyCanvas, pageWidth);

  // Use the last block's bottom as the effective body height instead of the
  // raw canvas height. PageContent's padding-bottom extends the canvas past the
  // last content block, which causes the cut-point loop to generate a blank
  // final page containing only that padding.
  const lastBlockBottomMM =
    blocks.length > 0 ? Math.max(...blocks.map((b) => b.bottom)) : bodyMM;
  const effectiveBodyMM = Math.min(lastBlockBottomMM, bodyMM);

  const cutPoints = computePageCutPoints(
    effectiveBodyMM,
    sliceMM,
    blocks,
    pageStartPositions,
  );

  const footerImages = await captureFooterImagesPerPage(
    tfootEl,
    cutPoints.length,
  );

  const dims: PageDimensions = {
    pageWidth,
    pageHeight,
    headerMM,
    footerMM,
    bodyMM,
  };
  const headerImage = canvasToJpeg(headerCanvas);
  const bodyImage = canvasToJpeg(bodyCanvas);

  let bodyOffset = 0;
  for (let i = 0; i < cutPoints.length; i++) {
    if (i > 0) pdf.addPage();
    const images: PageImages = {
      header: headerImage,
      body: bodyImage,
      footer: footerImages[i],
    };
    renderPdfPage(pdf, images, dims, bodyOffset, cutPoints[i]);
    bodyOffset = cutPoints[i];
  }

  pdf.save(`${fileName}.pdf`);
}
